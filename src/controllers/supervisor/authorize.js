const jwt = require('jsonwebtoken')
const { AuthError } = require('../../utils/customErrors')

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (authHeader && authHeader.substring) {
    const token = authHeader.substring(7)
    jwt.verify(token, process.env.JWT_KEY, { audience: 'super' }, (err, decoded) => {
      if (err) {
        return next(err)
      } else {
        res.locals.decoded = decoded
        return next()
      }
    })
  } else {
    return next(new AuthError())
  }
}