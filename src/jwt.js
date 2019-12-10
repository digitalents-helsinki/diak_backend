const jwt = require('jsonwebtoken')
const { AuthError } = require('./customErrors')

const checkToken = fn => (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (authHeader && authHeader.substring) {
    const token = authHeader.substring(7)
    jwt.verify(token, process.env.JWT_KEY, fn(req, res, next))
  } else {
    return next(new AuthError())
  }
}

exports.authenticateUser = checkToken((req, res, next) => (err, decoded) => {
  if (err) {
    return next(err)
  } else if (decoded.role !== 'admin') {
    return res.sendStatus(403)
  } else {
    res.locals.decoded = decoded
    return next()
  } 
})

exports.authenticateAdmin = checkToken((req, res, next) => (err, decoded) => {
  if (err) {
    return next(err)
  } else if (decoded.role !== 'admin') {
    return res.sendStatus(403)
  } else {
    res.locals.decoded = decoded
    return next()
  } 
})