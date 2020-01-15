const db = require('../../models')

module.exports = (req, res, next) => {
  return db.User.findOne({
    where: {
      role: 'admin',
      userId: req.body.id
    }
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(User => User.update({ role: 'user' })).then(() => res.send('Admin succesfully revoked')).catch(next)
}