const db = require('../../models')

module.exports = (req, res, next) => {
  return db.User.findAll({
    where: {
      role: 'admin'
    },
    attributes: ['userId', 'email']
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then((result) => res.json(result)).catch(next)
}