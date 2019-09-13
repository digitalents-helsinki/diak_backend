'use strict'

const uuidv4 = require('uuid/v4')
const checkToken = require('../jwt')

module.exports = (app, db) => {
  app.get('/result/:id', (req, res) => {
    db.models.SurveyResult.findAll({
      where: {
        id: req.params.id
      }
    }).then(result => res.json(result))
  })
  app.get('/results', checkToken, (req, res) => {
    db.models.SurveyResult.findAll().then(result => res.json(result))
  })
  app.post('/result', (req, res) => {
    db.models.SurveyResult.create({
      resultId: uuidv4(),
      health: req.body.health,
      overcoming: req.body.overcoming,
      living: req.body.living,
      coping: req.body.coping,
      family: req.body.family,
      friends: req.body.friends,
      finance: req.body.finance,
      strengths: req.body.strengths,
      self_esteem: req.body.self_esteem,
      life_as_whole: req.body.life_as_whole,
      health_desc: req.body.health_desc,
      overcoming_desc: req.body.overcoming_desc,
      living_desc: req.body.living_desc,
      coping_desc: req.body.coping_desc,
      family_desc: req.body.family_desc,
      friends_desc: req.body.friends_desc,
      finance_desc: req.body.finance_desc,
      strengths_desc: req.body.strengths_desc,
      self_esteem_desc: req.body.self_esteem_desc,
      life_as_whole_desc: req.body.life_as_whole_desc
    }).then(result => res.json(result))
  })
}
