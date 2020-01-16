const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const { StatusError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const Survey = await db.Survey.findByPk(req.params.id, {
    include: [db.Question],
    rejectOnEmpty: true
  })

  if (!Survey) return next(new StatusError("Survey does not exist", 404))

  const Group = await db.UserGroup.findOne({
    where: {
      SurveySurveyId: req.params.id
    },
    rejectOnEmpty: true
  })

  const AnonUser = await db.AnonUser.findOne({
    where: {
      entry_hash: req.params.entry_hash,
      UserGroupId: Group.id
    },
    attributes: ['id'],
    rejectOnEmpty: true
  })

  const currentTime = Date.now()

  if ((Survey.startDate !== null) && (currentTime < Survey.startDate.getTime())) return next(new StatusError(`Survey hasn't started, it will start on ${Survey.startDate}`, 403))
  if ((Survey.endDate !== null) && (Survey.endDate.getTime() < currentTime)) return next(new StatusError("Survey has ended", 403))
  if (!Survey.active) return next(new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403))
  if (Survey.archived) return next(new StatusError("Survey has been archived and answering is no longer possible", 403))

  const alreadyAnswered = await db.Answer.findOne({
    where: {
      final: true,
      SurveySurveyId: req.params.id,
      AnonUserId: AnonUser.id
    },
    attributes: ['answerId']
  })

  if (alreadyAnswered) return res.redirect(303, `/anon/result/${req.params.id}/${req.params.entry_hash}`)

  const savedAnswers = await db.Answer.findAll({
    where: {
      SurveySurveyId: Survey.surveyId,
      AnonUserId: AnonUser.id,
      final: false
    }
  })

  return res.json({ Survey, savedAnswers })
})