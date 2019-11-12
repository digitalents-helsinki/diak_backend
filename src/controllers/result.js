const uuidv4 = require('uuid/v4')
const sendMail = require('../mail')
const checkToken = require('../jwt')
const wrapAsync = require('../wrapAsync')
const StatusError = require('../statusError')

module.exports = (app, db) => {

  /* get anon users survey result */

  app.get('/anon/result/:id/:entry_hash', wrapAsync(async (req, res, next) => {
    const AnonUser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.params.entry_hash
      },
      attributes: ['id']
    })

    if (!AnonUser) return next(new StatusError("User does not exist", 403))

    const Result = await db.Survey.findByPk(req.params.id, {
      attributes: ['name', 'message', 'startDate', 'endDate', 'active', 'archived'],
      include: {
        model: db.Question,
        attributes: ['name', 'number', 'title'],
        required: true,
        include: {
          model: db.Answer,
          attributes: ['value'],
          where: {
            final: true,
            AnonUserId: AnonUser.id
          }
        }
      }
    })

    if (!Result) return next(new StatusError("Result does not exist", 404))

    const currentTime = Date.now()

    if ((Result.startDate !== null) && (currentTime < Result.startDate.getTime())) return next(new StatusError("Survey hasn't started", 403))
    if ((Result.endDate !== null) && (Result.endDate.getTime() < currentTime)) return next(new StatusError("Survey has ended", 403))
    if (!Result.active) return next(new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403))
    if (Result.archived) return next(new StatusError("Survey has been archived and answering is no longer possible", 403))

    const Averages = await db.Question.findAll({
      where: {
        SurveySurveyId: req.params.id
      },
      attributes: ['questionId', 'name', 'number', 'title', [db.sequelize.fn('AVG', db.sequelize.col('Answers.value')), 'answerAvg']],
      include: {
        model: db.Answer,
        attributes: []
      },
      group: ['Question.questionId']
    })

    return res.status(200).json({
      Result,
      Averages
    })
  }))

  /* get auth users survey result */

  app.get('/auth/result/:id', checkToken, wrapAsync(async (req, res, next) => {
    const User = await db.User.findOne({
      where: {
        email: res.locals.decoded.email
      },
      attributes: ['userId']
    })

    if (!User) return next(new StatusError("User does not exist", 403))

    const Result = await db.Survey.findByPk(req.params.id, {
      attributes: ['name', 'message', 'startDate', 'endDate', 'active', 'archived'],
      include: {
        model: db.Question,
        attributes: ['name', 'number', 'title'],
        required: true,
        include: {
          model: db.Answer,
          attributes: ['value'],
          where: {
            final: true,
            UserUserId: User.userId
          }
        }
      }
    })

    if (!Result) return next(new StatusError("Result does not exist", 404))

    const currentTime = Date.now()
    
    if ((Result.startDate !== null) && (currentTime < Result.startDate.getTime())) return next(new StatusError("Survey hasn't started", 403))
    if ((Result.endDate !== null) && (Result.endDate.getTime() < currentTime)) return next(new StatusError("Survey has ended", 403))
    if (!Result.active) return next(new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403))
    if (Result.archived) return next(new StatusError("Survey has been archived and answering is no longer possible", 403))

    const Averages = await db.Question.findAll({
      where: {
        SurveySurveyId: req.params.id
      },
      attributes: ['questionId', 'name', 'number', 'title', [db.sequelize.fn('AVG', db.sequelize.col('Answers.value')), 'answerAvg']],
      include: {
        model: db.Answer,
        where: {
          final: true
        },
        attributes: []
      },
      group: ['Question.questionId']
    })

    return res.json({
      Result,
      Averages
    })
  }))

  /* get surveys results */

  app.get('/results/:id', (req, res) => {
    db.Survey.findByPk(req.params.id, {
      include: [{
        model: db.Question,
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        },
        include: [{
          model: db.Answer,
          where: {
            final: true
          },
          required: false,
          attributes: {
            exclude: ['createdAt', 'updatedAt']
          }
        }]
      }]
    }).then((result) => res.json(result)).catch(err => console.log(err))
  })

  /* create auth users survey result */

  app.post("/auth/result/create", checkToken, wrapAsync(async (req, res) => {

    let transaction;

    try {
      transaction = await db.sequelize.transaction();

      const Survey = await db.Survey.findByPk(req.body.surveyId, {
        attributes: ["surveyId", "active", "startDate", "endDate"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const Group = await db.UserGroup.findOne({
        where: {
          SurveySurveyId: Survey.surveyId,
        },
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const [User] = await Group.getUsers({
        where: {
          email: res.locals.decoded.email
        },
        attributes: ["userId"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const alreadyAnswered = await db.Answer.findOne({
        where: {
          final: true,
          SurveySurveyId: Survey.surveyId,
          UserUserId: User.userId
        },
        lock: true,
        transaction
      })

      if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)

      await Survey.increment('responses', {transaction})
      
      const currentTime = Date.now()

      if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
      if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
      if (!Survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
      if (Survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)
  

      for (const answer of req.body.answers) {
        if (answer.description && answer.description.length > 2000) throw new StatusError("Answer is too long", 400)
        const [savedAnswer, created] = await db.Answer.findOrCreate({
          where: {
            SurveySurveyId: Survey.surveyId,
            UserUserId: User.userId,
            QuestionQuestionId: answer.id
          },
          defaults: {
            answerId: uuidv4(),
            value: answer.val,
            description: answer.desc
          },
          lock: true,
          transaction
        })
        if (created) {
          await Promise.all([
            savedAnswer.setSurvey(Survey, {transaction}),
            savedAnswer.setQuestion(answer.id, {transaction}),
            savedAnswer.setUser(User, {transaction})
          ])
        } else {
          await savedAnswer.update({
            value: answer.val,
            description: answer.desc,
            final: true
          }, {transaction})
        }
      }

      await transaction.commit()

    } catch (err) {
      await transaction.rollback()
      throw err
    } 
    if (transaction.finished === 'commit') res.json({status: "ok"})
  }))

    /* create anon users survey result */

  app.post("/anon/result/create", wrapAsync(async (req, res) => {

    let transaction;

    try {
      transaction = await db.sequelize.transaction();

      const anonuser = await db.AnonUser.findOne({
        where: {
          entry_hash: req.body.anonId
        },
        attributes: ["id"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const survey = await db.Survey.findByPk(req.body.surveyId, {
        attributes: ["surveyId", "active", "startDate", "endDate"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const alreadyAnswered = await db.Answer.findOne({
        where: {
          final: true,
          SurveySurveyId: survey.surveyId,
          AnonUserId: anonuser.id
        },
        lock: true,
        transaction
      })

      if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)

      await survey.increment('responses', {transaction})
      
      const currentTime = Date.now()

      if ((survey.startDate !== null) && (currentTime < survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
      if ((survey.endDate !== null) && (survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
      if (!survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
      if (survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)

      for (const answer of req.body.answers) {
        if (answer.description && answer.description.length > 2000) throw new StatusError("Answer is too long", 400)
        const [savedAnswer, created] = await db.Answer.findOrCreate({
          where: {
            SurveySurveyId: survey.surveyId,
            AnonUserId: anonuser.id,
            QuestionQuestionId: answer.id
          },
          defaults: {
            answerId: uuidv4(),
            value: answer.val,
            description: answer.desc
          },
          lock: true,
          transaction
        })
        if (created) {
          await Promise.all([
            savedAnswer.setSurvey(req.body.surveyId, {transaction}),
            savedAnswer.setQuestion(answer.id, {transaction}),
            savedAnswer.setAnonUser(anonuser, {transaction})
          ])
        } else {
          await savedAnswer.update({
            value: answer.val,
            description: answer.desc,
            final: true
          }, {transaction})
        }
      }

      await transaction.commit()

    } catch (err) {
      await transaction.rollback()
      throw err
    }
    if (transaction.finished === 'commit') res.json({status: "ok"})

  }))

  app.post('/auth/result/save', checkToken, wrapAsync(async (req, res, next) => {
    let transaction;

    try {
      transaction = await db.sequelize.transaction();

      const Survey = await db.Survey.findByPk(req.body.surveyId, {
        attributes: ["surveyId", "active", "startDate", "endDate"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const Group = await db.UserGroup.findOne({
        where: {
          SurveySurveyId: Survey.surveyId,
        },
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const [User] = await Group.getUsers({
        where: {
          email: res.locals.decoded.email
        },
        attributes: ["userId"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const alreadyAnswered = await db.Answer.findOne({
        where: {
          final: true,
          SurveySurveyId: Survey.surveyId,
          UserUserId: User.userId
        },
        lock: true,
        transaction
      })

      if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)
      
      const currentTime = Date.now()

      if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
      if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
      if (!Survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
      if (Survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)
  

      for (const answer of req.body.answers) {
        if (answer.description && answer.description.length > 2000) throw new StatusError("Answer is too long", 400)
        const [savedAnswer, created] = await db.Answer.findOrCreate({
          where: {
            SurveySurveyId: Survey.surveyId,
            UserUserId: User.userId,
            QuestionQuestionId: answer.id
          },
          defaults: {
            answerId: uuidv4(),
            value: answer.val,
            description: answer.desc,
            final: false
          },
          lock: true,
          transaction
        })
        if (created) {
          await Promise.all([
            savedAnswer.setSurvey(Survey, {transaction}),
            savedAnswer.setQuestion(answer.id, {transaction}),
            savedAnswer.setUser(User, {transaction})
          ])
        } else {
          await savedAnswer.update({
            value: answer.val,
            description: answer.desc
          }, {transaction})
        }
      }

      await transaction.commit()

    } catch (err) {
      await transaction.rollback()
      throw err
    } 
    if (transaction.finished === 'commit') res.json({status: "ok"})
  }))

  app.post('/anon/result/save/', wrapAsync(async (req, res, next) => {
    let transaction;

    try {
      transaction = await db.sequelize.transaction();

      const anonuser = await db.AnonUser.findOne({
        where: {
          entry_hash: req.body.anonId
        },
        attributes: ["id"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const survey = await db.Survey.findByPk(req.body.surveyId, {
        attributes: ["surveyId", "active", "startDate", "endDate"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const alreadyAnswered = await db.Answer.findOne({
        where: {
          final: true,
          SurveySurveyId: survey.surveyId,
          AnonUserId: anonuser.id
        },
        lock: true,
        transaction
      })

      if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)
      
      const currentTime = Date.now()

      if ((survey.startDate !== null) && (currentTime < survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
      if ((survey.endDate !== null) && (survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
      if (!survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
      if (survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)

      for (const answer of req.body.answers) {
        if (answer.description && answer.description.length > 2000) throw new StatusError("Answer is too long", 400)
        const [savedAnswer, created] = await db.Answer.findOrCreate({
          where: {
            SurveySurveyId: survey.surveyId,
            AnonUserId: anonuser.id,
            QuestionQuestionId: answer.id
          },
          defaults: {
            answerId: uuidv4(),
            value: answer.val,
            description: answer.desc,
            final: false
          },
          lock: true,
          transaction
        })
        if (created) {
          await Promise.all([
            savedAnswer.setSurvey(req.body.surveyId, {transaction}),
            savedAnswer.setQuestion(answer.id, {transaction}),
            savedAnswer.setAnonUser(anonuser, {transaction})
          ])
        } else {
          await savedAnswer.update({
            value: answer.val,
            description: answer.desc
          }, {transaction})
        }
      }

      await transaction.commit()

    } catch (err) {
      await transaction.rollback()
      throw err
    }
    if (transaction.finished === 'commit') res.json({status: "ok"})
  }))

  app.post("/auth/emailresult", checkToken, wrapAsync(async (req, res, next) => {
    
    const User = await db.User.findOne({
      where: {
        email: res.locals.decoded.email
      }
    })

    if (!User) return next(new StatusError("User does not exist", 401))

    const QuestionsAnswers = await db.Question.findAll({
      where: {
        SurveySurveyId: req.body.surveyId
      },
      include: {
        model: db.Answer,
        where: {
          final: true,
          UserUserId: User.userId
        }
      }
    })

    if (!QuestionsAnswers) return next(new StatusError("Result does not exist", 404))

    const defaultTitles = {
      health: 'Terveys',
      overcoming: 'Resilienssi',
      living: 'Asuminen',
      coping: 'Pärjääminen',
      family: 'Perhesuhteet',
      friends: 'Ystävyyssuhteet',
      finance: 'Talous',
      strengths: 'Itsensä kehittäminen',
      self_esteem: 'Itsetunto',
      life_as_whole: 'Elämään tyytyväisyys'
    }

    const tableContents = QuestionsAnswers.sort((a, b) => a.number - b.number).reduce((contents, obj, idx) => {
      return `
        ${contents}
        <tr>
          <td style="border: 1px solid grey; border-left: none;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${defaultTitles[obj.name] || obj.title}
          </td>
          <td style="border: 1px solid grey;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${obj.Answers[0].value === null ? '' : obj.Answers[0].value}
          </td>
          <td style="border: 1px solid grey; border-right: none;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${obj.Answers[0].description || ''}
          </td>
        </tr>
        `
    }, '')

    sendMail(User.email, 'Vastauksesi kyselyyn', 
      `Tässä ovat vastauksesi täyttämääsi kyselyyn:
      <br><br>
      <table style="border: 2px solid black; border-collapse: separate; border-spacing: 0; width: 100%;">
        <tr>
          <td style="border: 1px solid black; border-left: none; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Kysymys
          </td>
          <td style="border: 1px solid black; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Arvo
          </td>
          <td style="border: 1px solid black; border-right: none; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Kuvaus
          </td>
        </tr>
        ${tableContents}
      </table>
      `)
    
    return res.status(200).send("Email sent")
  }))
  app.post("/anon/emailresult", wrapAsync(async (req, res, next) => {

    const AnonUser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.body.anonId
      },
      attributes: ["id"]
    })

    if (!AnonUser) return next(new StatusError("User does not exist", 401))

    const QuestionsAnswers = await db.Question.findAll({
      where: {
        SurveySurveyId: req.body.surveyId
      },
      include: {
        model: db.Answer,
        where: {
          final: true,
          AnonUserId: AnonUser.id
        }
      }
    })

    if (!QuestionsAnswers) return next(new StatusError("Result does not exist", 404))

    const defaultTitles = {
      health: 'Terveys',
      overcoming: 'Resilienssi',
      living: 'Asuminen',
      coping: 'Pärjääminen',
      family: 'Perhesuhteet',
      friends: 'Ystävyyssuhteet',
      finance: 'Talous',
      strengths: 'Itsensä kehittäminen',
      self_esteem: 'Itsetunto',
      life_as_whole: 'Elämään tyytyväisyys'
    }

    const tableContents = QuestionsAnswers.sort((a, b) => a.number - b.number).reduce((contents, obj, idx) => {
      return `
        ${contents}
        <tr>
          <td style="border: 1px solid grey; border-left: none;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${defaultTitles[obj.name] || obj.title}
          </td>
          <td style="border: 1px solid grey;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${obj.Answers[0].value === null ? '' : obj.Answers[0].value}
          </td>
          <td style="border: 1px solid grey; border-right: none;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${obj.Answers[0].description || ''}
          </td>
        </tr>
        `
    }, '')

    sendMail(req.body.email, 'Vastauksesi kyselyyn', 
      `Tässä ovat vastauksesi täyttämääsi kyselyyn:
      <br><br>
      <table style="border: 2px solid black; border-collapse: separate; border-spacing: 0; width: 100%;">
        <tr>
          <td style="border: 1px solid black; border-left: none; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Kysymys
          </td>
          <td style="border: 1px solid black; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Arvo
          </td>
          <td style="border: 1px solid black; border-right: none; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Kuvaus
          </td>
        </tr>
        ${tableContents}
      </table>
      `)
    
    return res.status(200).send("Email sent")
  }))
}