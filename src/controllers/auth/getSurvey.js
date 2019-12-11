const wrapAsync = require('../../wrapAsync')
const db = require('../../models')
const { StatusError } = require('../../customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const Survey = await db.Survey.findByPk(req.params.id, {
    include: [db.Question]
  })

  if (!Survey) return next(new StatusError("Survey does not exist", 400))

  const Group = await db.UserGroup.findOne({
    where: {
      SurveySurveyId: req.params.id
    }
  })

  const User = await db.User.findOne({
    where: {
      userId: res.locals.decoded.userId
    }
  })

  if (!User) return next(new StatusError("User does not exist", 401))

  if (!await Group.hasUser(User)) return next(new StatusError("User does not have access to the survey", 401))

  const currentTime = Date.now()

  if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) return next(new StatusError("Survey hasn't started", 403))
  if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) return next(new StatusError("Survey has ended", 403))
  if (!Survey.active) return next(new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403))
  if (Survey.archived) return next(new StatusError("Survey has been archived and answering is no longer possible", 403))

  const alreadyAnswered = await db.Answer.findOne({
    where: {
      final: true,
      SurveySurveyId: req.params.id,
      UserUserId: User.userId
    }
  })

  if (alreadyAnswered) return res.redirect(303, `/auth/result/${req.params.id}`)
  
  const savedAnswers = await db.Answer.findAll({
    where: {
      SurveySurveyId: Survey.surveyId,
      UserUserId: User.userId,
      final: false
    }
  })

  return res.json({ Survey, savedAnswers })
})