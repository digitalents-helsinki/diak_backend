const jwt = require('jsonwebtoken')

exports.authenticateUser = (req, res, next) => {
  const token = req.headers['authorization'].substring(7)
  if (typeof token !== undefined) {
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        return res.sendStatus(403)
      } else {
        res.locals.decoded = decoded
        next()
      }
    })
  } else {
    res.sendStatus(403)
  }
}

exports.authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization'].substring(7)
  if (typeof token !== undefined) {
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err || decoded.role !== 'admin') {
        return res.sendStatus(403)
      } else {
        res.locals.decoded = decoded
        return next()
      } 
    })
  } else {
    return res.sendStatus(403)
  }
}