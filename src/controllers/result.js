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
              attributes: {
                exclude: ['createdAt', 'updatedAt']
              },
              required: true,
              include: [{
                model: db.Answer,
                attributes: {
                  exclude: ['createdAt', 'updatedAt']
                },
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
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        },
        include: [{
          model: db.Answer,
          attributes: {
            exclude: ['createdAt', 'updatedAt']
          }
        }]
      }]
    }).then((result) => res.json(result)).catch(err => console.log(err))
  })
  app.post("/result", async (req, res) => {

    let transaction;

    try {
      transaction = await db.sequelize.transaction();

      const anonuser = await db.AnonUser.findOne({
        attributes: ["id"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })

      const survey = await db.Survey.findByPk(req.body.surveyId, {
        attributes: ["surveyId", "active", "startDate", "endDate"],
        lock: true,
        rejectOnEmpty: true,
        transaction
      })
      await survey.increment('responses', {transaction})
      
      const currentTime = Date.now()
      if (survey.archived || !survey.active || ((survey.startDate !== null) && (survey.startDate.getTime() < currentTime)) && ((survey.endDate !== null) && (currentTime < survey.endDate.getTime()))) throw new Error("Survey not active")

      for (const answer of req.body.answers) {
        if (answer.description && answer.description.length > 2000) throw new Error("Answer is too long")
        const createdAnswer = await db.Answer.create({
          answerId: uuidv4(),
          value: answer.val,
          description: answer.desc
        }, {transaction})
        await Promise.all([
          createdAnswer.setSurvey(req.body.surveyId, {transaction}),
          createdAnswer.setQuestion(answer.id, {transaction}),
          createdAnswer.setAnonUser(anonuser, {transaction})
        ])
      }

      await transaction.commit()

    } catch (err) {
      await transaction.rollback()
      console.log(err)
    } finally {
      if (transaction.finished === 'commit') res.json({status: "ok"})
      else res.json({status: "not ok"})
    }

  })
  app.post("/testresult", async (req, res) => {
    let testikysely = await db.Survey.findOne({
      where: {
        name: "testikysely"
      }
    })
    testikysely.increment('responses')
    db.Question.findAll({
      where: {
        SurveySurveyId: testikysely.surveyId
      }
    }).then(async questions => {
      questions.forEach(async question => {
        let answer = await db.Answer.create({
          answerId: uuidv4(),
          value: req.body.answers[question.number - 1].val,
          description: req.body.answers[question.number - 1].desc
        })
        answer.setSurvey(testikysely.surveyId)
        answer.setQuestion(question)
      })
      return res.json({status: 'ok'})
    }).catch(err => console.log(err))
  })
}