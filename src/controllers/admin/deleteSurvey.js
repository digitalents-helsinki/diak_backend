const db = require('../../models')

module.exports = (req, res, next) => {
  return db.Survey.unscoped().findOne({
    where: {
      surveyId: req.params.surveyId,
      ownerId: res.locals.decoded.sub,
      surveyGroupId: null
    },
    rejectOnEmpty: true
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(Survey => Survey.destroy()).then(() => res.sendStatus(204)).catch(next)
}