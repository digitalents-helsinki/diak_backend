// const express = require('express')
const uuidv4 = require('uuid/v4')
const sendMail = require('../mail')
const crypto = require('crypto')
const checkToken = require('../jwt')
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
  app.post('/testsurvey/', async (req, res) => {
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
  })
  app.get('/survey/all', async (req, res) => {
    res.json(await db.Survey.findAll({
      include: {
        model: db.UserGroup,
        include: {
          model: db.User,
          attributes: ['email']
        }
      }
    }))
  })
  app.get('/anon/survey/:id', async (req, res) => {

    try {

      if (!req.headers['authorization']) throw new Error("401")
      const entry_hash = req.headers['authorization'].substring(7)

      const Survey = await db.Survey.findByPk(req.params.id, {
        include: [db.Question]
      })

      if (!Survey) throw new Error("404")

      const Group = await db.UserGroup.findOne({
        where: {
          SurveySurveyId: req.params.id
        }
      })

      const AnonUser = await db.AnonUser.findOne({
        where: {
          entry_hash: entry_hash,
          UserGroupId: Group.id
        }
      })

      if (!AnonUser) throw new Error("401")

      const currentTime = Date.now()

      if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new Error("Start")
      if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new Error("End")
      if (!Survey.active || Survey.archived) throw new Error("403")

      res.status(200).json(Survey)

    } catch(err) {
      console.log(err)
      switch(err.message) {
        case "401": 
          res.sendStatus(401)
          break
        case "403":
          res.sendStatus(403)
          break
        case "404":
          res.sendStatus(404)
          break
        case "Start":
          res.status(403).send("Survey has not started yet")
          break
        case "End":
          res.status(403).send("Survey has ended")
          break
        default:
          res.sendStatus(500)
      }
    }
  })
  app.get('/auth/survey/:id', checkToken, async (req, res) => {

    try {

      const Survey = await db.Survey.findByPk(req.params.id, {
        include: [db.Question]
      })

      if (!Survey) throw new Error("404")

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

      if (!Group.hasUser(User)) throw new Error("401")

      if (!User) throw new Error("401")

      const currentTime = Date.now()

      if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new Error("Start")
      if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new Error("End")
      if (!Survey.active || Survey.archived) throw new Error("403")

      res.status(200).json(Survey)

    } catch(err) {
      console.log(err)
      switch(err.message) {
        case "401": 
          res.sendStatus(401)
          break
        case "403":
          res.sendStatus(403)
          break
        case "404":
          res.sendStatus(404)
          break
        case "Start":
          res.status(403).send("Survey has not started yet")
          break
        case "End":
          res.status(403).send("Survey has ended")
          break
        default:
          res.sendStatus(500)
      }
    }
  })
  app.post('/survey/update', async (req, res) => {
    
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
      console.log(err)
    } finally {
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
      } else res.send('Survey update failed')
    }
  })
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