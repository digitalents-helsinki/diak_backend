const uuidv4 = require('uuid/v4')
const sendMail = require('../mail')
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
        where: {
          entry_hash: req.body.anonId
        },
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
  app.post("/emailresult", async (req, res) => {

    const AnonUser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.body.anonId
      },
      attributes: ["id"]
    })

    const QuestionsAnswers = await db.Question.findAll({
      where: {
        SurveySurveyId: req.body.surveyId
      },
      include: {
        model: db.Answer,
        where: {
          AnonUserId: AnonUser.id
        }
      }
    })

    const defaultTitles = {
      health: 'Terveys',
      overcoming: 'Resilienssi',
      living: 'Asuminen',
      coping: 'Pärjääminen',
      family: 'Perhesuhteet',
      friends: 'Ystävyyssuhteet',
      finance: 'Talous',
      strengths: 'Itsensä kehittäminen',
      self_esteem: 'Itsetunto',
      life_as_whole: 'Elämään tyytyväisyys'
    }

    const tableContents = QuestionsAnswers.sort((a, b) => a.number - b.number).reduce((contents, obj, idx) => {
      return `
        ${contents}
        <tr>
          <td style="border: 1px solid grey; border-left: none;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${defaultTitles[obj.name] || obj.title}
          </td>
          <td style="border: 1px solid grey;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${obj.Answers[0].value === null ? '' : obj.Answers[0].value}
          </td>
          <td style="border: 1px solid grey; border-right: none;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
            ${obj.Answers[0].description || ''}
          </td>
        </tr>
        `
    }, '')

    sendMail(req.body.email, 'Vastauksesi kyselyyn', 
      `Tässä ovat vastauksesi täyttämääsi kyselyyn:
      <br><br>
      <table style="border: 2px solid black; border-collapse: separate; border-spacing: 0; width: 100%;">
        <tr>
          <td style="border: 1px solid black; border-left: none; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Kysymys
          </td>
          <td style="border: 1px solid black; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Arvo
          </td>
          <td style="border: 1px solid black; border-right: none; border-top: none; text-align: center; font-size: 18px; font-weight: bold;">
            Kuvaus
          </td>
        </tr>
        ${tableContents}
      </table>
      `)
    
    res.send("Email sent")
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