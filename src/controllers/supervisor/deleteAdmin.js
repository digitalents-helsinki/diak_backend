const db = require('../../models')

module.exports = (req, res) => {
  db.User.destroy({
    where: {
      role: 'admin',
      userId: req.body.id
    }
  })
  res.json({status: 'ok'})
}