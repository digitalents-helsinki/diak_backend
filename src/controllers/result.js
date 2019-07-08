const uuidv4 = require('uuid/v4')

module.exports = (app, db) => {
  app.get('/result/:id', (req, res) => {
    db.models.SurveyResult.findAll({
      where: {
        id: req.params.id
      }
    }).then((result) => res.json(result))
  })
  app.post("/result", (req, res) => {
    db.models.SurveyResult.create({
      id: uuidv4(),
      health: req.body.health,
      overcoming: req.body.overcoming,
      living: req.body.living,
      coping: req.body.coping,
      family: req.body.family,
      friends: req.body.friends,
      finance: req.body.finance,
      strengths: req.body.strengths,
      self_esteem: req.body.self_esteem,
      life_as_whole: req.body.life_as_whole
    })
    res.json({status: 'ok', body: req.body})
  })
}