const jwt = require('jsonwebtoken')
const { AuthError } = require('../../utils/customErrors')
const crypto = require('crypto')

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const ctx = req.cookies.Ctx
  if (authHeader && authHeader.substring && ctx) {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_KEY, { audience: 'auth' })

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