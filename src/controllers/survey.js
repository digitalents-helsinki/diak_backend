// const express = require('express')
const uuidv4 = require('uuid/v4')
const sendMail = require('../mail')
const crypto = require('crypto')
// const router = express.Router()

module.exports = (app, db) => {
  app.post('/survey/create', (req, res, next) => {
    db.Survey.create({
      surveyId: uuidv4(),
      name: req.body.id,
      anon: req.body.anon,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      respondents_size: req.body.respondents_size,
      archived: false,
      active: false,
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
      if (req.body.anon == true) {
        let group = await db.UserGroup.create({
          id: uuidv4()
        })
        req.body.to.map(async to => {
          if (req.body.anon === true) {
            const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
            let anonuser = await db.AnonUser.create({
              id: uuidv4(),
              entry_hash: hash
            })
            group.addAnonUser(anonuser)
            sendMail(to, 'Uusi kysely', 
            `Täytä anonyymi kysely http://localhost:8080/questionnaire/${Survey.surveyId}/${hash}
            <br><br>
            ${req.body.message}
            `)
          } else {
            /*
            sendMail(to, 'Uusi kysely',
            'Täytä kysely http://localhost:8080/login/')
            */
          }
        })
      } else {
        // survey.setUsers(req.body.to)
      }
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
        active: false,
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
    res.json(await db.Survey.findAll())
  })
  app.get('/survey/:id', (req, res) => {
    db.Survey.findByPk(req.params.id, {
      include: [db.Question]
    }).then((result) => {
      const currentTime = Date.now()
      if (((result.startDate === null) || (result.startDate.getTime() < currentTime)) && ((result.endDate === null) || (currentTime < result.endDate.getTime()))){
        return res.json(result)
      }  else {
        return res.send("survey not active")
      }
    }).catch(err => console.log(err))
  

  })
  app.post('/survey/delete', (req, res) => {
    db.Survey.destroy({
      where: {
        id: req.body.id
      }
    })
    res.json({status: 'ok'})
  })
  app.post('/survey/archive', (req, res) => {
    db.Survey.update({
        archived: true
      }, {
      where: {
        surveyId: req.body.id
      }
    })
  })
  app.get('/surveys/:userId', (req, res) => {
    db.User.findOne({      
      where: {
        userId: req.params.userId
      },
      include: [db.Survey]
    }).then(response => res.json(response)).catch(err => console.log(err))
  })
}