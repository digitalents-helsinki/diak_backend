const jwt = require('jsonwebtoken')

module.exports = ({sub, aud, role}, secret = process.env.JWT_KEY) => {
  const minToExp = aud === 'recover' ? 15 : role === 'admin' ? 60 : 180
  const exp = Math.floor(Date.now() / 1000) + (minToExp * 60)
  const token = jwt.sign(
    {
      sub,
      aud,
      exp,
      role
    },
    secret
  )
  return token
}