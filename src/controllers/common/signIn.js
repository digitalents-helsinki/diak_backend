const wrapAsync = require('../../utils/wrapAsync')
const argon2 = require('argon2')
const db = require('../../models')
const generateToken = require('../../utils/generateToken')

module.exports = wrapAsync(async (req, res, next) => {
  const userRecord = await db.User.findOne({ 
    where: {
      $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
      password: {
        [db.Sequelize.Op.ne]: null
      }
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    }
  })

  const validPassword = await argon2.verify(userRecord.password, req.body.password)
  if (validPassword) {
    const token = generateToken({
      sub: userRecord.userId,
      aud: 'auth',
      role: userRecord.role
    })
    return res.json({ userId: userRecord.userId, token: token, role: userRecord.role })
  } else {
    return res.sendStatus(403)
  }
})