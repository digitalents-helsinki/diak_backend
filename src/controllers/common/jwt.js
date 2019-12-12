const jwt = require('jsonwebtoken')
const { AuthError } = require('../../utils/customErrors')

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (authHeader && authHeader.substring) {
    const token = authHeader.substring(7)
    jwt.verify(token, process.env.JWT_KEY, { audience: 'auth' }, (err, decoded) => {
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

exports.authorizeAdmin = (req, res, next) => {
  if (res.locals.decoded.role === 'admin') {
    return next()
  } else {
    return next(new AuthError(true))
  }
}