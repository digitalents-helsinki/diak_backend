const wrapAsync = require('../../utils/wrapAsync')
const argon2 = require('argon2')
const uuidv4 = require('uuid/v4')
const db = require('../../models')

module.exports = wrapAsync(async (req, res, next) => {
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
})