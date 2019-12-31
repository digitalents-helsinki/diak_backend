const db = require('../../models')

module.exports = (req, res, next) => {
  return db.User.destroy({
    where: {
      userId: req.params.userId,
      role: 'user'
    },
    limit: 1
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(rows => rows ? res.sendStatus(204) : res.sendStatus(404)).catch(next)
}