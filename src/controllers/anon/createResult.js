const wrapAsync = require('../../utils/wrapAsync')
const uuidv4 = require('uuid/v4')
const db = require('../../models')
const { StatusError } = require('../../utils/customErrors')
const asyncRecurser = require('../../utils/asyncRecurser')

module.exports = ({ final }) => wrapAsync(async (req, res, next) => {

  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    const survey = await db.Survey.findByPk(req.body.surveyId, {
      attributes: ["surveyId", "active", "startDate", "endDate"],
      lock: true,
      rejectOnEmpty: true,
      transaction
    })

    const group = await db.UserGroup.findOne({
      where: {
        SurveySurveyId: survey.surveyId
      },
      lock: true,
      rejectOnEmpty: true,
      transaction
    })
    
    const anonuser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.body.anonId,
        UserGroupId: group.id
      },
      attributes: ["id"],
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
      attributes: ['answerId'],
      lock: true,
      transaction
    })

    if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)

    if (final) await survey.increment('responses', {transaction})
    
    const currentTime = Date.now()

    if ((survey.startDate !== null) && (currentTime < survey.startDate.getTime())) throw new StatusError(`Survey hasn't started, it will start on ${survey.startDate}`, 403)
    if ((survey.endDate !== null) && (survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
    if (!survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
    if (survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)

    const Questions = await db.Question.findAll({
      where: {
        SurveySurveyId: survey.surveyId
      },
      attributes: ['questionId'],
      lock: true,
      transaction
    })

    await asyncRecurser(Questions, async (question, promises) => {
      const currentAnswer = req.body.answers.find(answer => answer.id === question.questionId)
      const [savedAnswer, created] = await db.Answer.findOrCreate({
        where: {
          SurveySurveyId: survey.surveyId,
          AnonUserId: anonuser.id,
          QuestionQuestionId: currentAnswer.id,
          final: false
        },
        defaults: {
          answerId: uuidv4(),
          value: currentAnswer.val,
          description: currentAnswer.desc,
          final
        },
        lock: true,
        transaction
      })
      if (created) {
        promises.push([
          savedAnswer.setSurvey(req.body.surveyId, {transaction}),
          savedAnswer.setQuestion(question.questionId, {transaction}),
          savedAnswer.setAnonUser(anonuser, {transaction})
        ])
      } else {
        promises.push(savedAnswer.update({
          value: currentAnswer.val,
          description: currentAnswer.desc,
          final
        }, {transaction}))
      }
    })

    await transaction.commit()

  } catch (err) {
    await transaction.rollback()
    return next(err)
  }
  if (transaction.finished === 'commit') res.json({status: "ok"})

})