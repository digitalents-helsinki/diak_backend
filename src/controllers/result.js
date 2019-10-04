const uuidv4 = require('uuid/v4')
const checkToken = require('../jwt')

module.exports = (app, db) => {
  app.get('/result/:id', (req, res) => {
    db.AnonUser.findOne({
      where: {
        entry_hash: req.body.anonId
      },
      attributes: ['id']
    }).then(async anonUser => {
      if (anonUser) {
        return res.json(
          await db.Survey.findByPk(req.params.id, {
            include: [{
              model: db.Question,
              required: true,
              include: [{
                model: db.Answer,
                where: {
                  AnonUserId: anonUser.id
                }
              }]
            }]
          })
        )
      } else {
        return res.send("Error")
      }
    }).catch(err => console.log(err))
  })
  app.get('/results/:id', (req, res) => {
    db.Survey.findByPk(req.params.id, {
      include: [{
        model: db.Question,
        include: [db.Answer]
      }]
    }).then((result) => res.json(result)).catch(err => console.log(err))
  })
  app.post("/result", (req, res) => {
    db.Question.findAll({
      where: {
        SurveySurveyId: req.body.surveyId
      }
    }).then(async questions => {
      let anonuser = await db.AnonUser.findOne({
        where: {
          entry_hash: req.body.anonId
        }
      })
      if (anonuser) {
        questions.forEach(async question => {
          let answer = await db.Answer.create({
            answerId: uuidv4(),
            value: req.body.answers[question.number - 1].val,
            description: req.body.answers[question.number - 1].desc
          })
          answer.setQuestion(question)
          answer.setAnonUser(anonuser)
        })
      }
      return res.json({status: 'ok'})
    }).catch(err => console.log(err))
  })
}