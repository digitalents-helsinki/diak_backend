const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { AuthError } = require('../../utils/customErrors')

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const ctx = req.cookies.SuperCtx
  if (authHeader && authHeader.substring && ctx) {
    const token = authHeader.substring(7)
    const secret = crypto.createHmac('sha256', process.env.HMAC_KEY).update(`${process.env.JWT_KEY}${process.env.SUPERVISOR_PASSWORD}`).digest('hex')
    const decoded = jwt.verify(token, secret, { audience: 'super' })

    const ctxHash = crypto.createHash('sha256').update(ctx).digest('hex')
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