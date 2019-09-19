const jwt = require('jsonwebtoken')

module.exports = checkToken = (req, res, next) => {
  const token = req.headers['authorization']
  if (typeof token !== undefined) {
    jwt.verify(token, process.env.JWT_KEY, (err) => {
      if (err) {
        return res.sendStatus(403)
      } else {
      next()
    }
  })
  } else {
    res.sendStatus(403)
  }
}