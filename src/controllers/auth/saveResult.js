const wrapAsync = require('../../wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const { StatusError } = require('../../customErrors')

module.exports = wrapAsync(async (req, res, next) => {
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
        userId: res.locals.decoded.userId
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
      lock: true,
      transaction
    })

    if (alreadyAnswered) throw new StatusError("User has already answered the survey", 403)
    
    const currentTime = Date.now()

    if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) throw new StatusError("Survey hasn't started", 403)
    if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) throw new StatusError("Survey has ended", 403)
    if (!Survey.active) throw new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403)
    if (Survey.archived) throw new StatusError("Survey has been archived and answering is no longer possible", 403)


    for (const answer of req.body.answers) {
      const [savedAnswer, created] = await db.Answer.findOrCreate({
        where: {
          SurveySurveyId: Survey.surveyId,
          UserUserId: User.userId,
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
          savedAnswer.setSurvey(Survey, {transaction}),
          savedAnswer.setQuestion(answer.id, {transaction}),
          savedAnswer.setUser(User, {transaction})
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