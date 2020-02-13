const wrapAsync = require('../../utils/wrapAsync')
const argon2 = require('argon2')
const db = require('../../models')
const generateAuthToken = require('../../utils/generateAuthToken')
const createRateLimiter = require('../../utils/createRateLimiter')
const { RateLimiterError } = require('../../utils/customErrors')

const maxWrongAttemptsByIpPerDay = 100
const maxConsecutiveFailsByEmailAndIp = 10

const limiterSlowBruteByIp = createRateLimiter({
  keyPrefix: 'login_fail_ip_per_day',
  points: maxWrongAttemptsByIpPerDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
})

const limiterConsecutiveFailsByEmailAndIp = createRateLimiter({
  keyPrefix: 'login_fail_consecutive_email_and_ip',
  points: maxConsecutiveFailsByEmailAndIp,
  duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
  blockDuration: 60 * 60, // Block for 1 hour, if 10 consecutive wrong attempts
});

const getEmailIpKey = (email, ip) => `${email.toLowerCase()}_${ip}`;

module.exports = wrapAsync(async (req, res, next) => {
  const ipAddr = req.ip
  const emailIpKey = getEmailIpKey(req.body.email, ipAddr)
  
  const [resSlowByIp, resEmailAndIp] = await Promise.all([limiterSlowBruteByIp.get(ipAddr), limiterConsecutiveFailsByEmailAndIp.get(emailIpKey)])
  if (resSlowByIp && resSlowByIp.consumedPoints >= maxWrongAttemptsByIpPerDay) return next(new RateLimiterError(resSlowByIp)) // check if over limit
  if (resEmailAndIp && resEmailAndIp.consumedPoints >= maxConsecutiveFailsByEmailAndIp) return next(new RateLimiterError(resEmailAndIp))

  const userRecord = await db.User.findOne({ 
    where: {
      $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
      password: {
        [db.Sequelize.Op.ne]: null
      }
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    }
  })

  if (!userRecord) {
    await limiterSlowBruteByIp.penalty(ipAddr) // apply only ip penalty if there's no registered user
    return res.sendStatus(404) // reveal user existence because registration reveals it anyway (and argon2 verify throws an error if there's nothing to compare against)
  }

  const validPassword = await argon2.verify(userRecord.password, req.body.password)

  if (validPassword) {
    const [{ token, ctx }] = await Promise.all([
      generateAuthToken({
        sub: userRecord.userId,
        role: userRecord.role
      }),
      limiterConsecutiveFailsByEmailAndIp.delete(emailIpKey) // Delete limit on succesful login
    ])
    
    return res.cookie('Ctx', ctx, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    }).json({
      authInfo: {
        userId: userRecord.userId, 
        email: userRecord.email,
        token: token, 
        role: userRecord.role
      },
      personalInfo: {
        name: userRecord.name,
        post_number: userRecord.post_number,
        phone_number: userRecord.phone_number,
        age: userRecord.age,
        gender: userRecord.gender
      }
    })
  } else {
    await Promise.all([limiterSlowBruteByIp.penalty(ipAddr), limiterConsecutiveFailsByEmailAndIp.penalty(emailIpKey)]) // apply both penalties
    return res.sendStatus(401)
  }
})