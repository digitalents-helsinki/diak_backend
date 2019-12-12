const db = require('../../models')
const { StatusError } = require('../../utils/customErrors')

module.exports = (req, res, next) => {
  if (db.sequelize.Validator.isLength(req.body.password, { min: 8, max: 128 })) {
    return next()
  } else {
    return next(new StatusError("Password needs to be between 8 and 128 characters long.", 422))
  }
}