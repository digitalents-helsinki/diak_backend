const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const { StatusError } = require('../../utils/customErrors')
const asyncRecurser = require('../../utils/asyncRecurser')

module.exports = ({ final }) => wrapAsync(async (req, res, next) => {
  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    const Survey = await db.Survey.findByPk(req.body.surveyId, {
      attributes: ["surveyId", "active", "startDate", "endDate"],
      lock: true,
      rejectOnEmpty: true,
      transaction
    })

    const Group = await db.UserGroup.findOne({
      where: {
        SurveySurveyId: Survey.surveyId,
      },
      lock: true,
      rejectOnEmpty: true,
      transaction
    })

    const [User] = await Group.getUsers({
      where: {
        userId: res.locals.decoded.sub
      },
      attributes: ["userId"],
      lock: true,
      rejectOnEmpty: true,
      transaction
    })

    const alreadyAnswered = await db.Answer.findOne({
      where: {
        final: true,
        SurveySurveyId: Survey.surveyId,
        UserUserId: User.userId
      },
      attributes: ['answerId'],
      lock: true,
      transaction
    })

    if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)

    if (final) await Survey.increment('responses', {transaction})
    
    const currentTime = Date.now()

    if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new StatusError(`Survey hasn't started, it will start on ${Survey.startDate}`, 403)
    if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
    if (!Survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
    if (Survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)

    const Questions = await db.Question.findAll({
      where: {
        SurveySurveyId: Survey.surveyId
      },
      attributes: ['questionId'],
      lock: true,
      transaction
    })

    await asyncRecurser(Questions, async (question, promises) => {
      const currentAnswer = req.body.answers.find(answer => answer.id === question.questionId)
      const [savedAnswer, created] = await db.Answer.findOrCreate({
        where: {
          SurveySurveyId: Survey.surveyId,
          UserUserId: User.userId,
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
          savedAnswer.setSurvey(Survey, {transaction}),
          savedAnswer.setQuestion(question.questionId, {transaction}),
          savedAnswer.setUser(User, {transaction})
        ])
      } else {
        promises.push(savedAnswer.update({
          value: savedAnswer.val,
          description: savedAnswer.desc,
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