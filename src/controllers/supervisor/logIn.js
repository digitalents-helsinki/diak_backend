const argon2 = require('argon2')
const wrapAsync = require('../../utils/wrapAsync')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

module.exports = wrapAsync(async (req, res, next) => {
  const validPassword = await argon2.verify(process.env.SUPERVISOR_PASSWORD, req.body.password)
  if (validPassword) {
    const ctx = await new Promise((resolve, reject) => crypto.randomBytes(50, (err, buf) => err ? reject(err) : resolve(buf.toString('hex'))))
    //const ctx = crypto.randomBytes(50).toString('hex')
    const ctxHash = crypto.createHash('sha256').update(ctx).digest('hex')

    const secret = crypto.createHmac('sha256', process.env.HMAC_KEY).update(`${process.env.JWT_KEY}${process.env.SUPERVISOR_PASSWORD}`).digest('hex')

    const token = jwt.sign(
      {
        sub: req.ip,
        aud: 'super',
        exp: Math.floor(Date.now() / 1000) + (15 * 60),
        ctxHash
      },
      secret
    )
    res.cookie('SuperCtx', ctx, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })
    return res.json({ token })
  } else {
    return res.sendStatus(401)
  }
})