const db = require('../../models')

module.exports = (req, res, next) => {
  return db.Survey.update({
      archived: true
    },
    {
      where: {
        surveyGroupId: req.params.surveyGroupId,
        ownerId: res.locals.decoded.sub
    }
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(([rows]) => rows ? res.sendStatus(204) : res.sendStatus(404)).catch(next)
}