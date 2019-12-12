const wrapAsync = require('../common/wrapAsync')
const db = require('../../models')
const { StatusError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const AnonUser = await db.AnonUser.findOne({
    where: {
      entry_hash: req.params.entry_hash
    },
    attributes: ['id']
  })

  if (!AnonUser) return next(new StatusError("User does not exist", 403))

  const Result = await db.Survey.findByPk(req.params.id, {
    attributes: ['name', 'message', 'startDate', 'endDate', 'active', 'archived'],
    include: {
      model: db.Question,
      attributes: ['name', 'number', 'title'],
      required: true,
      include: {
        model: db.Answer,
        attributes: ['value'],
        where: {
          final: true,
          AnonUserId: AnonUser.id
        }
      }
    }
  })

  if (!Result) return next(new StatusError("Result does not exist", 404))

  const currentTime = Date.now()

  if ((Result.startDate !== null) && (currentTime < Result.startDate.getTime())) return next(new StatusError("Survey hasn't started", 403))
  if ((Result.endDate !== null) && (Result.endDate.getTime() < currentTime)) return next(new StatusError("Survey has ended", 403))
  if (!Result.active) return next(new StatusError("Survey has been suspended by its administrator, it may become accessible at some later point in time", 403))
  if (Result.archived) return next(new StatusError("Survey has been archived and answering is no longer possible", 403))

  const Averages = await db.Question.findAll({
    where: {
      SurveySurveyId: req.params.id
    },
    attributes: ['questionId', 'name', 'number', 'title', [db.sequelize.fn('AVG', db.sequelize.col('Answers.value')), 'answerAvg']],
    include: {
      model: db.Answer,
      attributes: []
    },
    group: ['Question.questionId']
  })

  return res.status(200).json({
    Result,
    Averages
  })
})