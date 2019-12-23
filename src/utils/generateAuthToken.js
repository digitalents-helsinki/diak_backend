const jwt = require('jsonwebtoken')
const crypto = require('crypto')

module.exports = async ({sub, role}) => {
  const aud = 'auth'
  const minToExp =  role === 'admin' ? 60 : 180
  const exp = Math.floor(Date.now() / 1000) + (minToExp * 60)

  const ctx = await new Promise((resolve, reject) => crypto.randomBytes(50, (err, buf) => err ? reject(err) : resolve(buf.toString('hex'))))
  const ctxHash = crypto.createHash('sha256').update(ctx).digest('hex')

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