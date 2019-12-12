const wrapAsync = require('./wrapAsync')
const argon2 = require('argon2')
const db = require('../../models')
const generateToken = require('../../utils/generateToken')

module.exports = wrapAsync(async (req, res) => {
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
    const today = new Date()
    const exp = new Date(today)
    exp.setDate(today.getDate() + 7)
    const token = generateToken({
      sub: userRecord.userId,
      aud: 'auth',
      role: userRecord.role
    })
    res.json({ success: true, userId: userRecord.userId, token: token, role: userRecord.role })
  } else {
    res.json({success: false})
    throw new Error('Invalid password')
  }
})