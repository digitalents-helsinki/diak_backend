const uuidv4 = require('uuid/v4')
const Mailer = require('./mail')

module.exports = (app, db) => {
  app.post('/survey/create', (req, res) => {
    db.Survey.create({
      surveyId: uuidv4(),
      name: req.body.id,
      anon: req.body.anon,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      respondents_size: req.body.respondents_size,
      archived: false,
      active: false,
      adminId: req.body.adminId
    })
    res.json({status: 'ok'})
  })
  app.get('/survey/all', (req, res) => {
    db.models.Survey.findAll().then((result) => res.json(result))
  })
  app.get('/survey/all/:id', (req, res) => {
    db.models.Survey.findAll({
      where: {
        adminId: req.params.id
      }
    }).then((result) => res.json(result))
  })
  app.post('/survey/delete', (req, res) => {
    db.models.Survey.destroy({
      where: {
        surveyId: req.body.id
      }
    })
    res.json({status: 'ok'})
  })
  app.post('/survey/archive', (req, res) => {
    db.models.Survey.update({
        archived: true
      }, {
      where: {
        surveyId: req.body.id
      }
    })
  })
  app.get('/surveys/:userId', (req, res) => {
    db.User
  })
}