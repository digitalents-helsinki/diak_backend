// const express = require('express')
const uuidv4 = require('uuid/v4')
const sendMail = require('../mail')
const mailUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://stupefied-joliot-1a8c88.netlify.com'
const crypto = require('crypto')
const { authenticateUser, authenticateAdmin } = require('../jwt')
const wrapAsync = require('../wrapAsync')
const StatusError = require('../statusError')
// const router = express.Router()

module.exports = (app, db) => {
  app.post('/admin/survey/create', authenticateAdmin, wrapAsync(async (req, res, next) => {

    let transaction
    const sendMails = []

    try {
      transaction = await db.sequelize.transaction()

      const Survey = await db.Survey.create({
        surveyId: uuidv4(),
        ownerId: res.locals.decoded.userId,
        name: req.body.id,
        message: req.body.message,
        anon: req.body.anon,
        startDate: req.body.startDate ? new Date(req.body.startDate).setHours(0, 0, 0) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59) : null,
        respondents_size: req.body.to.length,
        Questions: req.body.questions.map(question => {
          return {
            questionId: uuidv4(),
            name: question.name || uuidv4() + '_custom',
            number: question.number,
            title: question.title,
            description: question.description,
            help: question.help
          }
        })
      },
      { 
        include: [db.Question],
        transaction
      })

      const Group = await db.UserGroup.create({
        id: uuidv4(),
        respondents: Survey.anon ? req.body.to : []
      }, {transaction})

      await Group.setSurvey(Survey, {transaction})

      for (const to of req.body.to) {
        if (Survey.anon) {
          const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
          const AnonUser = await db.AnonUser.create({
            id: uuidv4(),
            entry_hash: hash
          }, {transaction})
          await Group.addAnonUser(AnonUser, {transaction})
          sendMails.push([to, 'Uusi kysely',
          `Täytä anonyymi kysely ${mailUrl}/anon/questionnaire/${Survey.surveyId}/${hash}
          <br><br>
          ${Survey.message}
          `])
        } else {
          const [User] = await db.User.findOrCreate({
            where: {
              $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', to))
            },
            defaults: {
              userId: uuidv4(),
              email: to
            },
            lock: true,
            transaction
          })
          await Group.addUser(User, {transaction})
          sendMails.push([to, 'Uusi kysely',
          `Täytä kysely ${mailUrl}/auth/questionnaire/${Survey.surveyId}
          <br><br>
          ${Survey.message}`])
        }
      }

      await transaction.commit()

    } catch(err) {
      await transaction.rollback()
      return next(err)
    }
    if (transaction.finished === 'commit') {
      sendMails.forEach(params => sendMail(...params))
      return res.send("Survey succesfully created")
    }
  }))
  app.get('/admin/survey/all', authenticateAdmin, (req, res, next) => {
    return db.Survey.findAll({
      where: {
        ownerId: res.locals.decoded.userId
      },
      include: {
        model: db.UserGroup,
        include: {
          model: db.User,
          attributes: ['email']
        }
      }
    }).then(Surveys => res.json(Surveys)).catch(next)
  })
  app.get('/admin/survey/:surveyId', authenticateAdmin, (req, res, next) => {
    return db.Survey.findOne({
      where: {
        surveyId: req.params.surveyId,
        ownerId: res.locals.decoded.userId
      },
      include: [{
        model: db.Question,
        attributes: ['name', 'title', 'description', 'help', 'number']
      },
      {
        model: db.UserGroup,
        include: {
          model: db.User,
          attributes: ['email']
        }
      }],
      rejectOnEmpty: true
    }).then(Survey => res.json(Survey)).catch(next)
  })
  app.get('/anon/survey/:id/:entry_hash', wrapAsync(async (req, res, next) => {
    const Survey = await db.Survey.findByPk(req.params.id, {
      include: [db.Question]
    })

    if (!Survey) return next(new StatusError("Survey does not exist", 400))

    const Group = await db.UserGroup.findOne({
      where: {
        SurveySurveyId: req.params.id
      }
    })

    const AnonUser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.params.entry_hash,
        UserGroupId: Group.id
      }
    })

    if (!AnonUser) return next(new StatusError("User does not exist or does not have access to the survey", 401))

    const currentTime = Date.now()

    if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) return next(new StatusError("Survey hasn't started", 403))
    if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) return next(new StatusError("Survey has ended", 403))
    if (!Survey.active) return next(new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403))
    if (Survey.archived) return next(new StatusError("Survey has been archived and answering is no longer possible", 403))

    const alreadyAnswered = await db.Answer.findOne({
      where: {
        final: true,
        SurveySurveyId: req.params.id,
        AnonUserId: AnonUser.id
      }
    })

    if (alreadyAnswered) return res.redirect(303, `/anon/result/${req.params.id}/${req.params.entry_hash}`)

    const savedAnswers = await db.Answer.findAll({
      where: {
        SurveySurveyId: Survey.surveyId,
        AnonUserId: AnonUser.id,
        final: false
      }
    })

    return res.json({ Survey, savedAnswers })
  }))
  app.get('/auth/survey/:id', authenticateUser, wrapAsync(async (req, res, next) => {
    const Survey = await db.Survey.findByPk(req.params.id, {
      include: [db.Question]
    })

    if (!Survey) return next(new StatusError("Survey does not exist", 400))

    const Group = await db.UserGroup.findOne({
      where: {
        SurveySurveyId: req.params.id
      }
    })

    const User = await db.User.findOne({
      where: {
        userId: res.locals.decoded.userId
      }
    })

    if (!User) return next(new StatusError("User does not exist", 401))

    if (!await Group.hasUser(User)) return next(new StatusError("User does not have access to the survey", 401))

    const currentTime = Date.now()

    if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) return next(new StatusError("Survey hasn't started", 403))
    if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) return next(new StatusError("Survey has ended", 403))
    if (!Survey.active) return next(new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403))
    if (Survey.archived) return next(new StatusError("Survey has been archived and answering is no longer possible", 403))

    const alreadyAnswered = await db.Answer.findOne({
      where: {
        final: true,
        SurveySurveyId: req.params.id,
        UserUserId: User.userId
      }
    })

    if (alreadyAnswered) return res.redirect(303, `/auth/result/${req.params.id}`)
    
    const savedAnswers = await db.Answer.findAll({
      where: {
        SurveySurveyId: Survey.surveyId,
        UserUserId: User.userId,
        final: false
      }
    })

    return res.json({ Survey, savedAnswers })
  }))
  app.patch('/admin/survey/:surveyId/update', authenticateAdmin, wrapAsync(async (req, res, next) => {
    
    let transaction
    const sendMails = []

    try {
      transaction = await db.sequelize.transaction();

      const Survey = await db.Survey.findOne({
        where: {
          surveyId: req.params.surveyId,
          ownerId: res.locals.decoded.userId
        },
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      if (Survey.archived) throw new StatusError("Survey has been archived and thus it cannot be modified", 403)

      const Group = await db.UserGroup.findOne({
        where: {
          SurveySurveyId: Survey.surveyId
        },
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const emails = [...new Set(req.body.to)]
      const anonEmails = emails.filter(email => !Group.respondents.includes(email))

      await Survey.update({
        name: req.body.name,
        endDate: req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59) : null,
        respondents_size: Survey.anon ? anonEmails.length + Survey.respondents_size : emails.length,
        active: req.body.active
      }, {transaction})

      if (Survey.anon) {
        await Group.update({respondents: [...Group.respondents, ...anonEmails]}, {transaction})
        for (const to of anonEmails) {
          const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
          let anonuser = await db.AnonUser.create({
            id: uuidv4(),
            entry_hash: hash
          }, {transaction})
          await Group.addAnonUser(anonuser, {transaction})
          sendMails.push([to, 'Uusi kysely', 
          `Täytä anonyymi kysely ${mailUrl}/anon/questionnaire/${Survey.surveyId}/${hash}
          <br><br>
          ${Survey.message}
          `])
        }
      } else {
        const Users = await Group.getUsers({
          attributes: ['userId', 'email'],
          lock: true,
          transaction
        })
        const comparisonUserEmails = Users.map(user => user.email.toLowerCase())
        const addedRespondents = emails.filter(email => !comparisonUserEmails.some(userEmail => userEmail === email))
        const comparisonEmails = emails.map(email => email.toLowerCase())
        const removedRespondents = Users.filter(user => !comparisonEmails.includes(user.email.toLowerCase()))
        for (const to of addedRespondents) {
          const [User] = await db.User.findOrCreate({
            where: {
              $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', to))
            },
            attributes: ['userId'],
            defaults: {
              userId: uuidv4(),
              email: to
            },
            lock: true,
            transaction
          })
          await Group.addUser(User, {transaction})
          sendMails.push([to, 'Uusi kysely',
          `Täytä kysely ${mailUrl}/auth/questionnaire/${Survey.surveyId}
          <br><br>
          ${Survey.message}`])
        }
        for (const User of removedRespondents) {
          await Group.removeUser(User, {transaction})
          const rows = await db.Answer.destroy({
            where: {
              SurveySurveyId: Survey.surveyId,
              UserUserId: User.userId
            },
            force: true,
            transaction
          })
          if (rows) {
            await Survey.decrement('responses', {transaction})
          }
        }
      }
      
      await transaction.commit()

    } catch(err) {
      await transaction.rollback()
      return next(err)
    }
    if (transaction.finished === 'commit') {
      sendMails.forEach(params => sendMail(...params))
      const Survey = await db.Survey.findByPk(req.params.surveyId, {
        include: {
          model: db.UserGroup,
          include: {
            model: db.User
          }
        }
      })
      if (Survey) return res.json(Survey)
      else return res.sendStatus(410)
    }
  }))
  app.delete('/admin/survey/:surveyId/delete', authenticateAdmin, (req, res, next) => {
    return db.Survey.destroy({
      where: {
        surveyId: req.params.surveyId,
        ownerId: res.locals.decoded.userId
      },
      limit: 1
    }).then(rows => rows ? res.sendStatus(204) : res.sendStatus(404)).catch(next)
  })
  app.patch('/admin/survey/:surveyId/archive', authenticateAdmin, (req, res, next) => {
    return db.Survey.update({
        archived: true
      },
      {
      where: {
        surveyId: req.params.surveyId,
        ownerId: res.locals.decoded.userId
      },
      limit: 1
    }).then(([rows]) => rows ? res.sendStatus(204) : res.sendStatus(404)).catch(next)
  })
}