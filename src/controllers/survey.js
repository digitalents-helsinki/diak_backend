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
    .then(survey => {
      // survey.setAdmin(req.body.adminId)
      if (req.body.anon == true) {
        db.UserGroup.create({
          id: uuidv4()
        })
      } else {
        // survey.setUsers(req.body.to)
      }
      return true
    })
    .catch(err => console.log(err))

    req.body.to.map(to => {
      if (req.body.anon === true) {
        const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
        db.AnonUser.create({
          id: uuidv4(),
          entry_hash: hash
        })
        sendMail(to, 'Uusi kysely', 
        'Täytä anonyymi kysely http://localhost:8080/questionnaire/' + req.body.id + '/' + hash)
      } else {
        /*
        sendMail(to, 'Uusi kysely',
        'Täytä kysely http://localhost:8080/login/')
        */
      }
    })
    res.json({ success: true })
  })
  app.get('/survey/all', (req, res) => {
    db.Survey.findAll().then((result) => res.json(result))
  })
  app.get('/survey/all/:id', (req, res) => {
    db.Survey.findAll({
      where: {
        surveyId: req.params.id
      }
    }).then((result) => res.json(result))
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