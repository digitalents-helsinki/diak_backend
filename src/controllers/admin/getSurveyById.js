const db = require('../../models')

module.exports = (req, res, next) => {
  return db.Survey.unscoped().findOne({
    where: {
      surveyId: req.params.surveyId,
      ownerId: res.locals.decoded.sub
    },
    include: [{
      model: db.Question,
      attributes: ['name', 'title', 'description', 'help', 'number']
    },
    {
      model: db.UserGroup,
      include: {
        model: db.User,
        attributes: ['email']
      }
    }],
    rejectOnEmpty: true
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(Survey => res.json(Survey)).catch(next)
}