const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { AuthError } = require('../../utils/customErrors')

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const ctx = req.cookies.SuperCtx
  if (authHeader && authHeader.substring && ctx) {
    const token = authHeader.substring(7)
    const secret = crypto.createHmac('sha512', process.env.HMAC_1024BIT_SECRET_KEY).update(`${process.env.JWT_512BIT_SECRET_KEY}${process.env.SUPERVISOR_PASSWORD_AS_ENCODED_ARGON2_HASH}`).digest('hex')
    const decoded = jwt.verify(token, secret, { audience: 'super' })

    const ctxHash = crypto.createHash('sha512').update(ctx).digest('hex')
    const validCtx = crypto.timingSafeEqual(Buffer.from(decoded.ctxHash), Buffer.from(ctxHash))
    if (validCtx) {
      res.locals.decoded = decoded
      return next()
    } else {
      return next(new AuthError('ctx'))
    }
  } else {
    return next(new AuthError('invalid'))
  }
}