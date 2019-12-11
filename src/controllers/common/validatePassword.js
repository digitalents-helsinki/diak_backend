const db = require('../../models')
const { StatusError } = require('../../customErrors')

module.exports = (req, res, next) => {
  if (db.sequelize.Validator.isLength(req.body.password, { min: 8 })) {
    return next()
  } else {
    return next(new StatusError("Password needs to be at least 8 characters long.", 422))
  }
}