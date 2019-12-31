const wrapAsync = require('../../utils/wrapAsync')
const hashPassword = require('../../utils/hashPassword')
const db = require('../../models')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { AuthError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.substring) return next(new AuthError('invalid'))
  const token = authHeader.substring(7)
  const { sub: userId } = jwt.decode(token)
  const userRecord = await db.User.findOne({ 
    where: {
      userId,
      password: null // this is the only thing protecting this endpoint against jwt replay attacks
    },
    attributes: ['userId', 'createdAt']
  })
  
  const secret = crypto.createHmac('sha256', process.env.HMAC_KEY).update(`${process.env.JWT_KEY}${userRecord.createdAt.getTime()}`).digest('hex')

  jwt.verify(token, secret, { audience: 'create' })

  const hashedPassword = await hashPassword(req.body.password)

  await userRecord.update({
    password: hashedPassword
  })

  return res.sendStatus(200)
})