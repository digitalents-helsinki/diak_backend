const db = require('../../models')

module.exports = (req, res, next) => {
  return db.Survey.unscoped().destroy({
    where: {
      surveyId: req.params.surveyId,
      ownerId: res.locals.decoded.userId
    },
    limit: 1
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(rows => rows ? res.sendStatus(204) : res.sendStatus(404)).catch(next)
}