const argon2 = require('argon2')
const wrapAsync = require('../common/wrapAsync')
const jwt = require('jsonwebtoken')

module.exports = wrapAsync(async (req, res, next) => {
  const validPassword = await argon2.verify(process.env.SUPERVISOR_PASSWORD, req.body.password)
  if (validPassword) {
    const token = jwt.sign(
      {
        sub: req.ip,
        aud: 'super',
        exp: Math.floor(Date.now() / 1000) + (15 * 60)
      },
      process.env.JWT_KEY
    )
    return res.json({ token })
  } else {
    return res.sendStatus(403)
  }
})