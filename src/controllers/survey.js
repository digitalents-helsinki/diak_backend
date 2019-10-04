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
      active: false
    })
    .then(async Survey => {
      Survey.setQuestions(await db.Question.bulkCreate(req.body.questions.map(question => {
        return {
          questionId: uuidv4(),
          name: question.name || uuidv4() + '_custom',
          number: question.number,
          title: question.title,
          description: question.description,
          help: question.help
        }
      })))
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
            'Täytä anonyymi kysely http://localhost:8080/questionnaire/' + Survey.surveyId + '/' + hash)
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
  app.get('/survey/all', async (req, res) => {
    res.json(await db.Survey.findAll())
  })
  app.get('/survey/:id', (req, res) => {
    db.Survey.findByPk(req.params.id, {
      include: [db.Question]
    }).then((result) => res.json(result)).catch((err) => err)
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
    // TODO
    db.Survey.findAll({
      
    })
  })
}