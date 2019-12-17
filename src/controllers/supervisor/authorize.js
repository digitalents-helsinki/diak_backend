const jwt = require('jsonwebtoken')

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
    return res.sendStatus(403)
  }
}