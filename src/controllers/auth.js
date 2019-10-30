const uuidv4 = require('uuid/v4')
const jwt = require('jsonwebtoken')
const argon2 = require('argon2')
const { randomBytes } = require('crypto')

module.exports = (app, db) => {
  app.post('/signup', async (req, res) => {
    const salt = randomBytes(32)
    const hashedPassword = await argon2.hash(req.body.password, { salt })
    db.User.findOne({ where: {email: req.body.email }})
    .then(obj => {
      if(obj) {
        return obj.update({
          role: 'user',
          password: hashedPassword,
          salt: salt.toString('hex')
        })
      } else {
        return db.User.create({
          userId: uuidv4(),
          role: 'user',
          email: req.body.email,
          password: hashedPassword,
          salt: salt.toString('hex')
        })
      }
    })
    .catch(err => console.log(err))
    res.json({ success: 'true' })
  })

  app.post('/signin', async (req, res) => {
    const userRecord = await db.User.findOne({ 
      where: {
        email: req.body.email 
      }
    })
    if (!userRecord) {
      res.json({success: false})
      throw new Error('User not registered')
    }
    const validPassword = await argon2.verify(userRecord.password, req.body.password)
    if (validPassword) {
      const token = generateToken(userRecord)
      res.json({ success: true, userId: userRecord.userId, token: token, role: userRecord.role })
    } else {
      res.json({success: false})
      throw new Error('Invalid password')
    }
  })
  app.post('/logout', (req, res) => {

  })

  function generateToken(user) {
    const today = new Date()
    const exp = new Date(today)
    exp.setDate(today.getDate() + 7)
    return jwt.sign(
      {
        role: user.role,
        email: user.email,
        exp: exp.getTime() / 100
      },
      process.env.JWT_KEY
    )
  }
}