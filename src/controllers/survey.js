const uuidv4 = require('uuid/v4')
const Mailer = require('./mail')

module.exports = (app, db) => {
  app.post('/survey/create', (req, res) => {
    db.models.Survey.create({
      id: uuidv4(),
      name: req.body.id,
      anon: req.body.anon,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      respondents_size: req.body.respondents_size
    })
    res.json({status: 'ok'})
  })
  app.get('/survey/all', (req, res) => {
    db.models.Survey.findAll().then((result) => res.json(result))
  })
  app.post('/survey/delete', (req, res) => {
    db.models.Survey.destroy({
      where: {
        id: req.body.id
      }
    })
    res.json({status: 'ok'})
  })
}