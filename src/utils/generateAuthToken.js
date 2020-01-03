const jwt = require('jsonwebtoken')
const getRandomBytes = require('./getRandomBytes')
const crypto = require('crypto')

module.exports = async ({sub, role}) => {
  const aud = 'auth'
  const minToExp =  role === 'admin' ? 60 : 180
  const exp = Math.floor(Date.now() / 1000) + (minToExp * 60)

  const ctx = await getRandomBytes(50)
  const ctxHash = crypto.createHash('sha512').update(ctx).digest('hex')

  const token = jwt.sign(
    {
      sub,
      aud,
      exp,
      role,
      ctxHash
    },
    process.env.JWT_KEY
  )

  return {
    token,
    ctx
  }
}