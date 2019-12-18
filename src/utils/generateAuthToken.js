const jwt = require('jsonwebtoken')

module.exports = ({sub, role}) => {
  const aud = 'auth'
  const minToExp =  role === 'admin' ? 60 : 180
  const exp = Math.floor(Date.now() / 1000) + (minToExp * 60)
  const token = jwt.sign(
    {
      sub,
      aud,
      exp,
      role
    },
    process.env.JWT_KEY
  )
  return token
}