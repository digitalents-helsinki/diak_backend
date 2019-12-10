const uuidv4 = require('uuid/v4')
const jwt = require('jsonwebtoken')
const argon2 = require('argon2')
const wrapAsync = require('../wrapAsync')
const sendMail = require('../mail')
const mailUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://stupefied-joliot-1a8c88.netlify.com'
const { AuthError } = require('../customErrors')

module.exports = (app, db) => {
  app.post('/signup', wrapAsync(async (req, res) => {
    const hashedPassword = await argon2.hash(req.body.password)
    const [User, created] = await db.User.findOrCreate({
      where: {
        $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
        password: null
      },
      defaults: {
        userId: uuidv4(),
        role: 'user',
        email: req.body.email,
        password: hashedPassword
      }
    })

    if (!created) {
      await User.update({
        role: 'user',
        password: hashedPassword
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

  app.post('/recover', wrapAsync(async (req, res, next) => {
    
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

    const secret = `${userRecord.password}-${userRecord.createdAt.getTime()}`
    const token = jwt.sign(
      {
        userId: userRecord.userId,
        exp: Math.floor(Date.now() / 1000) + (15 * 60)
      },
      secret
    )

    sendMail(userRecord.email, 'Salasanan palautus',
      `Pääset vaihtamaan salasanasi täältä: ${mailUrl}/password/${token}`)

  }))

  app.post('/changepassword', wrapAsync(async (req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader || !authHeader.substring) return next(new AuthError())
    const token = authHeader.substring(7)
    const { userId } = jwt.decode(token)
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
    jwt.verify(token, secret)

    const hashedPassword = await argon2.hash(req.body.password)

    await userRecord.update({
      password: hashedPassword
    })

    return res.sendStatus(200)
  }))

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