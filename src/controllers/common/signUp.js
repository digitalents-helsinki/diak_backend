const wrapAsync = require('../../utils/wrapAsync')
const hashPassword = require('../../utils/hashPassword')
const uuidv4 = require('uuid/v4')
const db = require('../../models')
const createRateLimiter = require('../../utils/createRateLimiter')
const { RateLimiterError } = require('../../utils/customErrors')

const maxRegistrationsByIpPerDay = 100

const limiterRegistrationByIpPerDay = createRateLimiter({
  keyPrefix: 'registration_ip_per_day',
  points: maxRegistrationsByIpPerDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 registrations per day
})

module.exports = wrapAsync(async (req, res, next) => {
  const hashedPassword = await hashPassword(req.body.password)

  const InvitedUser = await db.User.findOne({
    where: {
      $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
      password: null
    }
  })

  if (InvitedUser) {
    await InvitedUser.update({
      role: 'user',
      password: hashedPassword
    })
  } else {
    const ipAddr = req.ip
    const resRegistrationByIp = await limiterRegistrationByIpPerDay.get(ipAddr) // only check limit if there was no "invitation" to register
    if (resRegistrationByIp && resRegistrationByIp.consumedPoints >= maxRegistrationsByIpPerDay) return next(new RateLimiterError(resRegistrationByIp))

    const UserCreation = db.User.create({
      userId: uuidv4(),
      role: 'user',
      email: req.body.email,
      password: hashedPassword
    })
    await Promise.all[UserCreation, limiterRegistrationByIpPerDay.penalty(ipAddr)] // only apply penalty if there was no "invitation" to register
  }
  
  return res.status(201).send("Registration succesful")
})