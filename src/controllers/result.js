const uuidv4 = require('uuid/v4')
const checkToken = require('../jwt')

module.exports = (app, db) => {
  app.get('/result/:id', (req, res) => {
    db.SurveyResult.findAll({
      where: {
        resultId: req.params.id
      }
    }).then((result) => res.json(result))
  })
  app.get('/results/:groupId', (req, res) => {
    db.SurveyResult.findAll({
      where: {
        id: req.params.groupId
      }
    }).then((result) => res.json(result))
    .catch(err => console.log(err))
  })
  app.post("/result", (req, res) => {
    const id = uuidv4()
    db.SurveyResult.create({
      resultId: id,
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
    }).then(async result => {
      let anonuser = await db.AnonUser.findOne({
        where: {
          entry_hash: req.body.anonId
        }
      })
      result.setAnonUser(anonuser)
      return true
    }).catch(err => console.log(err))
    res.json({status: 'ok', resultId: id})
  })
}