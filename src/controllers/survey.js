// const express = require('express')
const uuidv4 = require('uuid/v4')
const sendMail = require('../mail')
const crypto = require('crypto')
const checkToken = require('../jwt')
const wrapAsync = require('../wrapAsync')
const StatusError = require('../statusError')
// const router = express.Router()

module.exports = (app, db) => {
  app.post('/survey/create', (req, res, next) => {
    if (req.body.questions.some(question => !question.name && (question.title.length > 100 || question.description.length > 200 || (question.help && question.help.length > 1000)))) {
      return res.json({success: false})
    }
    db.Survey.create({
      surveyId: uuidv4(),
      name: req.body.id,
      message: req.body.message,
      anon: req.body.anon,
      startDate: req.body.startDate ? new Date(req.body.startDate).setHours(0, 0, 0) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59) : null,
      respondents_size: req.body.respondents_size,
      archived: false,
      active: true,
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
    { include: [db.Question] }
    ).then(async Survey => {
      // survey.setAdmin(req.body.adminId)
      let group = await db.UserGroup.create({
        id: uuidv4(),
        respondents: req.body.anon ? req.body.to : []
      })
      group.setSurvey(Survey)
      req.body.to.map(async to => {
        if (req.body.anon === true) {
          const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
          let anonuser = await db.AnonUser.create({
            id: uuidv4(),
            entry_hash: hash
          })
          group.addAnonUser(anonuser)
          sendMail(to, 'Uusi kysely', 
          `Täytä anonyymi kysely http://localhost:8080/anon/questionnaire/${Survey.surveyId}/${hash}
          <br><br>
          ${Survey.message}
          `)
        } else {
          db.User.findOne({ where: {email: to}})
          .then(async obj => {
            if (obj) {
              group.addUser(obj)
              sendMail(to, 'Uusi kysely',
              `Täytä kysely http://localhost:8080/auth/questionnaire/${Survey.surveyId}/${obj.userId}`)
            } else {
              let user = await db.User.create({
                userId: uuidv4(),
                email: to
              })
              group.addUser(user)
              sendMail(to, 'Uusi kysely',
              `Täytä kysely http://localhost:8080/auth/questionnaire/${Survey.surveyId}/${user.userId}`)
            }
            return true
          })
          .catch(err => console.log(err))
        }
      })
      return true
    })
    .catch(err => console.log(err))
    res.json({ success: true })
  })
  app.post('/testsurvey/', wrapAsync(async (req, res) => {
    db.Survey.findOrCreate({
      where: {
        name: "testikysely"
      },
      defaults: {
        surveyId: uuidv4(),
        name: "testikysely",
        anon: true,
        archived: false,
        active: true,
        Questions: [{name:"health",number:1},{name:"overcoming",number:2},{name:"living",number:3},{name:"coping",number:4},{name:"family",number:5},{name:"friends",number:6},{name:"finance",number:7},{name:"strengths",number:8},{name:"self_esteem",number:9},{name:"life_as_whole",number:10}].map(question => {
          return {
            questionId: uuidv4(),
            name: question.name,
            number: question.number
          }
        })
      },
      include: [ db.Question ]
    }).then(async ([testSurvey]) => {
      return res.send(testSurvey.surveyId)
    }).catch(err => console.log(err))
  }))
  app.get('/survey/all', wrapAsync(async (req, res) => {
    res.json(await db.Survey.findAll({
      include: {
        model: db.UserGroup,
        include: {
          model: db.User,
          attributes: ['email']
        }
      }
    }))
  }))
  app.get('/anon/survey/:id/:entry_hash', wrapAsync(async (req, res) => {
    const Survey = await db.Survey.findByPk(req.params.id, {
      include: [db.Question]
    })

    if (!Survey) throw new StatusError("Survey does not exist", 400)

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

    if (!AnonUser) throw new StatusError("User does not exist or does not have access to the survey", 401)

    const alreadyAnswered = await db.Answer.findOne({
      where: {
        final: true,
        SurveySurveyId: req.params.id,
        AnonUserId: AnonUser.id
      }
    })

    if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)

    const currentTime = Date.now()

    if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
    if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
    if (!Survey.active || Survey.archived) throw new StatusError("Survey is not active", 403)

    res.status(200).json(Survey)
  }))
  app.get('/auth/survey/:id', checkToken, wrapAsync(async (req, res) => {
    const Survey = await db.Survey.findByPk(req.params.id, {
      include: [db.Question]
    })

    if (!Survey) throw new StatusError("Survey does not exist", 400)

    const Group = await db.UserGroup.findOne({
      where: {
        SurveySurveyId: req.params.id
      }
    })

    const User = await db.User.findOne({
      where: {
        email: res.locals.decoded.email
      }
    })

    if (!User) throw new StatusError("User does not exist", 401)

    if (!Group.hasUser(User)) throw new StatusError("User does not have access to the survey", 401)

    const alreadyAnswered = await db.Answer.findOne({
      where: {
        final: true,
        SurveySurveyId: req.params.id,
        UserUserId: User.userId
      }
    })

    if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)

    const currentTime = Date.now()

    if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
    if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
    if (!Survey.active || Survey.archived) throw new StatusError("Survey is not active", 403)

    res.status(200).json(Survey)
  }))
  app.post('/survey/update', wrapAsync(async (req, res) => {
    
    let transaction
    const sendMails = []

    try {
      transaction = await db.sequelize.transaction();

      const Survey = await db.Survey.findByPk(req.body.surveyId, {
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

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
        respondents_size: Survey.anon ? anonEmails.length + Survey.respondents_size : emails.length
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
          `Täytä anonyymi kysely http://localhost:8080/questionnaire/${Survey.surveyId}/${hash}
          <br><br>
          ${Survey.message}
          `])
        }
      } else {
        const Users = await Group.getUsers({
          lock: true,
          transaction
        })
        const addedRespondents = emails.filter(email => !Users.some(user => user.email === email))
        const removedRespondents = Users.filter(user => !emails.includes(user.email))
        for (const to of addedRespondents) {
          const [User] = await db.User.findOrCreate({
            where: {
              email: to
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
          `Täytä kysely http://localhost:8080/questionnaire/${Survey.surveyId}`])
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
      throw err
    }
    if (transaction.finished === 'commit') {
      sendMails.forEach(params => sendMail(...params))
      res.json(await db.Survey.findByPk(req.body.surveyId, {
        include: {
          model: db.UserGroup,
          include: {
            model: db.User
          }
        }
      }))
    }
  }))
  app.post('/survey/suspendactivate', (req, res) => {
    db.Survey.update({
        active: req.body.active
      },{
      where: {
        surveyId: req.body.id
      },
      returning: []
    }).then(([,[survey]]) => survey ? res.send("Survey state changed succesfully") : res.send("No survey found")).catch(err => res.json({ err: err }))
  })
  app.post('/survey/delete', (req, res) => {
    //TODO: make it delete all answers and questions (usergroups?)
    db.Survey.destroy({
      where: {
        surveyId: req.body.id
      }
    }).then(rows => rows ? res.send("Survey deleted succesfully") : res.send("No survey found")).catch(err => res.json({ err: err }))
  })
  app.post('/survey/archive', (req, res) => {
    db.Survey.update({
        archived: true
      }, {
      where: {
        surveyId: req.body.id
      },
      returning: []
    }).then(([,[survey]]) => survey ? res.send("Survey archived succesfully") : res.send("No survey found")).catch(err => res.json({ err: err }))
  })
  app.get('/surveys/:userId', (req, res) => {
    db.User.findAll({
      where: {
        userId: req.params.userId
      },
      include: [ db.Survey ]
    }).then(result => result ? res.json(result) : res.json({ err: 'no user found' })).catch(err => res.json({ err: err }))
  })
}