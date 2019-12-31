const db = require('../../models')

module.exports = (req, res, next) => {
  return db.User.update({
    role: 'user'
  },
  {
    where: {
      role: 'admin',
      userId: req.body.id
    },
    limit: 1
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(([rows]) => rows ? res.sendStatus(200) : res.sendStatus(404)).catch(next)
}