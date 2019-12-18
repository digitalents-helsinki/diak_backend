const wrapAsync = require('../../utils/wrapAsync')
const sendMail = require('../../utils/mail')
const db = require('../../models')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

module.exports = wrapAsync(async (req, res, next) => {
    
  res.sendStatus(200)
  
  const userRecord = await db.User.findOne({ 
    where: {
      $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
      password: {
        [db.Sequelize.Op.ne]: null
      }
    },
    attributes: ['userId', 'password', 'email', 'createdAt'],
    rejectOnEmpty: true
  })

  const secret = crypto.createHmac('sha256', process.env.HMAC_KEY).update(`${userRecord.password}-${userRecord.createdAt.getTime()}`).digest('hex')

  const token = jwt.sign(
    {
      sub: userRecord.userId,
      aud: 'recover',
      exp: Math.floor(Date.now() / 1000) + (15 * 60)
    },
    secret
  )

  sendMail(userRecord.email, 'Salasanan palautus',
    `Pääset vaihtamaan salasanasi täältä: ${process.env.FRONTEND_URL}/password/${token}`)

})