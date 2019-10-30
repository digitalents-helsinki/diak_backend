const uuidv4 = require('uuid/v4')
const sendMail = require('../mail')
const checkToken = require('../jwt')

module.exports = (app, db) => {

  /* get anon users survey result */

  app.get('/anon/result/:id/:entry_hash', (req, res) => {
    db.AnonUser.findOne({
      where: {
        entry_hash: req.params.entry_hash
      },
      attributes: ['id']
    }).then(async anonUser => {
      if (anonUser) {
        return res.json(
          await db.Survey.findByPk(req.params.id, {
            include: [{
              model: db.Question,
              attributes: {
                exclude: ['createdAt', 'updatedAt']
              },
              required: true,
              include: [{
                model: db.Answer,
                attributes: {
                  exclude: ['createdAt', 'updatedAt']
                },
                where: {
                  AnonUserId: anonUser.id
                }
              }]
            }]
          })
        )
      } else {
        return res.send("Error")
      }
    }).catch(err => console.log(err))
  })

  /* get auth users survey result */

  app.get('/auth/result/:id', checkToken, (req, res) => {
    db.User.findOne({
      where: {
        email: res.locals.decoded.email
      },
      attributes: ['id']
    }).then(async user => {
      if (user) {
        return res.json(
          await db.Survey.findByPk(req.params.id, {
            include: [{
              model: db.Question,
              attributes: {
                exclude: ['createdAt', 'updatedAt']
              },
              required: true,
              include: [{
                model: db.Answer,
                attributes: {
                  exclude: ['createdAt', 'updatedAt']
                },
                where: {
                  userId: user.id
                }
              }]
            }]
          })
        )
      } else {
        return res.send("Error")
      }
    }).catch(err => console.log(err))
  })

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
          attributes: {
            exclude: ['createdAt', 'updatedAt']
          }
        }]
      }]
    }).then((result) => res.json(result)).catch(err => console.log(err))
  })

  /* create auth users survey result */

  app.post("/auth/result/create", checkToken, async (req, res) => {

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
          SurveySurveyId: Survey.surveyId,
          UserUserId: User.userId
        },
        lock: true,
        transaction
      })

      if (alreadyAnswered) throw new Error("Survey has already been answered by this user")

      await Survey.increment('responses', {transaction})
      
      const currentTime = Date.now()
      if (Survey.archived || !Survey.active || ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) || ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime))) throw new Error("Survey not active")

      for (const answer of req.body.answers) {
        if (answer.description && answer.description.length > 2000) throw new Error("Answer is too long")
        const createdAnswer = await db.Answer.create({
          answerId: uuidv4(),
          value: answer.val,
          description: answer.desc
        }, {transaction})
        await Promise.all([
          createdAnswer.setSurvey(Survey, {transaction}),
          createdAnswer.setQuestion(answer.id, {transaction}),
          createdAnswer.setUser(User, {transaction})
        ])
      }

      await transaction.commit()

    } catch (err) {
      await transaction.rollback()
      console.log(err)
    } finally {
      if (transaction.finished === 'commit') res.json({status: "ok"})
      else res.json({status: "not ok"})
    }

  })

    /* create anon users survey result */

  app.post("/anon/result/create", async (req, res) => {

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
          SurveySurveyId: survey.surveyId,
          AnonUserId: anonuser.id
        },
        lock: true,
        transaction
      })

      if (alreadyAnswered) throw new Error("Survey has already been answered by this user")

      await survey.increment('responses', {transaction})
      
      const currentTime = Date.now()
      if (survey.archived || !survey.active || ((survey.startDate !== null) && (currentTime < survey.startDate.getTime())) || ((survey.endDate !== null) && (survey.endDate.getTime() < currentTime))) throw new Error("Survey not active")

      for (const answer of req.body.answers) {
        if (answer.description && answer.description.length > 2000) throw new Error("Answer is too long")
        const createdAnswer = await db.Answer.create({
          answerId: uuidv4(),
          value: answer.val,
          description: answer.desc
        }, {transaction})
        await Promise.all([
          createdAnswer.setSurvey(req.body.surveyId, {transaction}),
          createdAnswer.setQuestion(answer.id, {transaction}),
          createdAnswer.setAnonUser(anonuser, {transaction})
        ])
      }

      await transaction.commit()

    } catch (err) {
      await transaction.rollback()
      console.log(err)
    } finally {
      if (transaction.finished === 'commit') res.json({status: "ok"})
      else res.json({status: "not ok"})
    }

  })
  app.post("/auth/emailresult", checkToken, async (req, res) => {
    
    const User = await db.User.findOne({
      where: {
        email: res.locals.decoded.email
      }
    })

    const QuestionsAnswers = await db.Question.findAll({
      where: {
        SurveySurveyId: req.body.surveyId
      },
      include: {
        model: db.Answer,
        where: {
          UserUserId: User.userId
        }
      }
    })

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
    
    res.send("Email sent")
  })
  app.post("/anon/emailresult", async (req, res) => {

    const AnonUser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.body.anonId
      },
      attributes: ["id"]
    })

    const QuestionsAnswers = await db.Question.findAll({
      where: {
        SurveySurveyId: req.body.surveyId
      },
      include: {
        model: db.Answer,
        where: {
          AnonUserId: AnonUser.id
        }
      }
    })

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
    
    res.send("Email sent")
  })

  /* create test surveys result */

  app.post("/testresult/create", async (req, res) => {
    let testikysely = await db.Survey.findOne({
      where: {
        name: "testikysely"
      }
    })
    testikysely.increment('responses')
    db.Question.findAll({
      where: {
        SurveySurveyId: testikysely.surveyId
      }
    }).then(async questions => {
      questions.forEach(async question => {
        let answer = await db.Answer.create({
          answerId: uuidv4(),
          value: req.body.answers[question.number - 1].val,
          description: req.body.answers[question.number - 1].desc
        })
        answer.setSurvey(testikysely.surveyId)
        answer.setQuestion(question)
      })
      return res.json({status: 'ok'})
    }).catch(err => console.log(err))
  })
}