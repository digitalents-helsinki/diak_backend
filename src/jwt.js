const jwt = require('jsonwebtoken')

module.exports = function checkToken (req, res, next) {
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