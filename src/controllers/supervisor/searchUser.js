const db = require('../../models')

module.exports = (req, res, next) => {
  const searchTerm = req.params.searchTerm
  const searchType = db.sequelize.Validator.isEmail(searchTerm) ? 'email' : 'name' // search by email or name

  return db.User.findAll({
    where: {
      [searchType]: searchTerm,
      role: 'user'
    },
    attributes: ['userId', 'email', 'name']
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(results => res.json(results)).catch(next)
}