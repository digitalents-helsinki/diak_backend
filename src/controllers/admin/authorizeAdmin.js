const { AuthError } = require('../../utils/customErrors')

module.exports = (req, res, next) => {
  if (res.locals.decoded.role === 'admin') {
    return next()
  } else {
    return next(new AuthError('role'))
  }
}