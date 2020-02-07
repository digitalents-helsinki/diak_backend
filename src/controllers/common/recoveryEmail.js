const wrapAsync = require('../../utils/wrapAsync')
const { sendCustomEmail } = require('../../utils/sendMail')
const db = require('../../models')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const createRateLimiter = require('../../utils/createRateLimiter')
const { RateLimiterError } = require('../../utils/customErrors')

const maxRecoveriesByIpPerDay = 20
const secondsBetweenRecoveries = 15 * 60

const limiterRecoveryByIpPerDay = createRateLimiter({
  keyPrefix: 'recovery_ip_per_day',
  points: maxRecoveriesByIpPerDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 20 recoveries per day per ip
})

const limiterRecoveryRateLimit = createRateLimiter({
  keyPrefix: 'recovery_rate_limit',
  points: 1,
  duration: secondsBetweenRecoveries // Block account recovery by email for the amount of time the link we send is active for
})

module.exports = wrapAsync(async (req, res, next) => {

  res.sendStatus(200)

  await limiterRecoveryByIpPerDay.consume(req.ip).catch(rejRes => { throw new RateLimiterError(rejRes) })
    
  const userRecord = await db.User.findOne({ 
    where: {
      $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
      password: {
        [db.Sequelize.Op.ne]: null
      },
      external_id: null
    },
    attributes: ['userId', 'password', 'email', 'createdAt'],
    rejectOnEmpty: true
  })
  
  const secret = crypto.createHmac('sha512', process.env.HMAC_1024BIT_SECRET_KEY).update(`${userRecord.password}${userRecord.createdAt.getTime()}`).digest()
  
  const token = jwt.sign(
    {
      sub: userRecord.userId,
      aud: 'recover',
      exp: Math.floor(Date.now() / 1000) + secondsBetweenRecoveries
    },
    secret
  )

  await limiterRecoveryRateLimit.consume(req.body.email.toLowerCase()).catch(rejRes => { throw new RateLimiterError(rejRes) })
  
  sendCustomEmail(userRecord.email, '3X10D unohtunut salasana',
    `Pääset vaihtamaan salasanasi alla olevasta linkistä. Linkki toimii ${Math.round(secondsBetweenRecoveries / 60)} minuutin ajan.
    <br><br>
    ${process.env.FRONTEND_URL}/password/change/${token}`
  )

})