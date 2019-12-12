const wrapAsync = require('./wrapAsync')
const argon2 = require('argon2')
const db = require('../../models')
const jwt = require('jsonwebtoken')
const { AuthError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.substring) return next(new AuthError())
  const token = authHeader.substring(7)
  const { sub: userId } = jwt.decode(token)
  const userRecord = await db.User.findOne({ 
    where: {
      userId,
      password: {
        [db.Sequelize.Op.ne]: null
      }
    },
    attributes: ['userId', 'password', 'email', 'createdAt']
  })
  
  const secret = `${userRecord.password}-${userRecord.createdAt.getTime()}`
  jwt.verify(token, secret, { audience: 'recover' })

  const hashedPassword = await argon2.hash(req.body.password)

  await userRecord.update({
    password: hashedPassword
  })

  return res.sendStatus(200)
})