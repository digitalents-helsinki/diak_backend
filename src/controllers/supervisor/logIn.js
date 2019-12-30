const argon2 = require('argon2')
const wrapAsync = require('../../utils/wrapAsync')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const getRandomBytes = require('../../utils/getRandomBytes')
const createRateLimiter = require('../../utils/createRateLimiter')
const { RateLimiterError } = require('../../utils/customErrors')

const maxWrongAttemptsByIpPerDay = 5

const limiterSlowBruteByIp = createRateLimiter({
  keyPrefix: 'supervisor_login_fail_ip_per_day',
  points: maxWrongAttemptsByIpPerDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 5 wrong attempts per day
})

module.exports = wrapAsync(async (req, res, next) => {
  await limiterSlowBruteByIp.consume(req.ip).catch(rejRes => { throw new RateLimiterError(rejRes) })
  
  const validPassword = await argon2.verify(process.env.SUPERVISOR_PASSWORD, req.body.password)
  if (validPassword) {
    const ctx = await getRandomBytes(50)
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
    return res.cookie('SuperCtx', ctx, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }).json({ token })
  } else {
    return res.sendStatus(401)
  }
})