const uuidv4 = require('uuid/v4')
const jwt = require('jsonwebtoken')
const argon2 = require('argon2')
const { randomBytes } = require('crypto')
const wrapAsync = require('../wrapAsync')

module.exports = (app, db) => {
  app.post('/signup', wrapAsync(async (req, res) => {
    const salt = randomBytes(32)
    const hashedPassword = await argon2.hash(req.body.password, { salt })
    const [User, created] = await db.User.findOrCreate({
      where: {
        $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
        password: null
      },
      defaults: {
        userId: uuidv4(),
        role: 'user',
        email: req.body.email,
        password: hashedPassword,
        salt: salt.toString('hex')
      }
    })

    if (!created) {
      await User.update({
        role: 'user',
        password: hashedPassword,
        salt: salt.toString('hex')
      })
    }

    return res.status(201).send("Registration succesful")
  }))

  app.post('/signin', wrapAsync(async (req, res) => {
    const userRecord = await db.User.findOne({ 
      where: {
        $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
        password: {
          [db.Sequelize.Op.ne]: null
        }
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
  }))
  app.post('/logout', (req, res) => {

  })

  app.post('/supervisor/login', (req, res) => {
    if (
      req.body.username === process.env.SUPERVISOR_USERNAME && 
      req.body.password === process.env.SUPERVISOR_PASSWORD) {
        res.json({success: true})
    } else {
      res.json({success: false})
    }
  }) 

  function generateToken(user) {
    const today = new Date()
    const exp = new Date(today)
    exp.setDate(today.getDate() + 7)
    return jwt.sign(
      {
        role: user.role,
        userId: user.userId,
        exp: exp.getTime() / 100
      },
      process.env.JWT_KEY
    )
  }
}