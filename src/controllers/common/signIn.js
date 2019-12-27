const wrapAsync = require('../../utils/wrapAsync')
const argon2 = require('argon2')
const db = require('../../models')
const generateAuthToken = require('../../utils/generateAuthToken')

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
    },
    rejectOnEmpty: true // reveal user existence because registration reveals it anyway (and argon2 verify throws an error if there's nothing to compare against)
  })

  const validPassword = await argon2.verify(userRecord.password, req.body.password)

  if (validPassword) {
    const { token, ctx } = await generateAuthToken({
      sub: userRecord.userId,
      role: userRecord.role
    })
    return res.cookie('Ctx', ctx, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }).json({ userId: userRecord.userId, token: token, role: userRecord.role })
  } else {
    return res.sendStatus(401)
  }
})