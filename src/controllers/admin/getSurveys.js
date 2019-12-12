const db = require('../../models')

module.exports = (req, res, next) => {
  return db.Survey.unscoped().findAll({
    where: {
      ownerId: res.locals.decoded.sub
    },
    include: {
      model: db.UserGroup,
      include: {
        model: db.User,
        attributes: ['email']
      }
    }
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(Surveys => res.json(Surveys)).catch(next)
}