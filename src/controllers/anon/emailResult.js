const db = require('../../models')
const wrapAsync = require('../../utils/wrapAsync')
const { StatusError } = require('../../utils/customErrors')
const { CustomEmail } = require('../../utils/sendMail')
const escape = require('escape-html')

module.exports = wrapAsync(async (req, res, next) => {

  if (!db.sequelize.Validator.isEmail(req.body.email)) return next(new StatusError("Email validation failed", 422))

  const AnonUser = await db.AnonUser.findOne({
    where: {
      entry_hash: req.body.anonId
    },
    attributes: ["id"],
    rejectOnEmpty: true
  })

  const QuestionsAnswers = await db.Question.findAll({
    where: {
      SurveySurveyId: req.body.surveyId
    },
    include: {
      model: db.Answer,
      where: {
        final: true,
        AnonUserId: AnonUser.id
      }
    },
    rejectOnEmpty: true
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
          ${escape(defaultTitles[obj.name] || obj.title)}
        </td>
        <td style="border: 1px solid grey;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
          ${escape(obj.Answers[0].value === null ? '' : obj.Answers[0].value)}
        </td>
        <td style="border: 1px solid grey; border-right: none;${idx === 0 ? ' border-top: 1px solid black;' : idx + 1 === QuestionsAnswers.length ? ' border-bottom: none;' : ''} text-align: center;">
          ${escape(obj.Answers[0].description || '')}
        </td>
      </tr>
      `
  }, '')

  new CustomEmail(req.body.email, 'Vastauksesi kyselyyn',
    `Tässä ovat vastauksesi täyttämääsi 3X10D -kyselyyn:
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
    </table>`
  ).send()
  
  return res.send("Email sent")
})