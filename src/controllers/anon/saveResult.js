const wrapAsync = require('../../wrapAsync')
const uuidv4 = require('uuid/v4')
const db = require('../../models')
const { StatusError } = require('../../customErrors')

module.exports = wrapAsync(async (req, res, next) => {
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

    const alreadyAnswered = await db.Answer.findOne({
      where: {
        final: true,
        SurveySurveyId: survey.surveyId,
        AnonUserId: anonuser.id
      },
      lock: true,
      transaction
    })

    if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)
    
    const currentTime = Date.now()

    if ((survey.startDate !== null) && (currentTime < survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
    if ((survey.endDate !== null) && (survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
    if (!survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
    if (survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)

    for (const answer of req.body.answers) {
      const [savedAnswer, created] = await db.Answer.findOrCreate({
        where: {
          SurveySurveyId: survey.surveyId,
          AnonUserId: anonuser.id,
          QuestionQuestionId: answer.id
        },
        defaults: {
          answerId: uuidv4(),
          value: answer.val,
          description: answer.desc,
          final: false
        },
        lock: true,
        transaction
      })
      if (created) {
        await Promise.all([
          savedAnswer.setSurvey(req.body.surveyId, {transaction}),
          savedAnswer.setQuestion(answer.id, {transaction}),
          savedAnswer.setAnonUser(anonuser, {transaction})
        ])
      } else {
        await savedAnswer.update({
          value: answer.val,
          description: answer.desc
        }, {transaction})
      }
    }

    await transaction.commit()

  } catch (err) {
    await transaction.rollback()
    throw err
  }
  if (transaction.finished === 'commit') res.json({status: "ok"})
})