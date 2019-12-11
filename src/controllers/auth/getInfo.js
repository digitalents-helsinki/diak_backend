const wrapAsync = require('../../wrapAsync')
const db = require('../../models')
const { StatusError } = require('../../customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const User = await db.User.findOne({
    where: {
      userId: res.locals.decoded.userId
    }
  })

  if (!User) return next(new StatusError("User does not exist", 404))

  return res.json(User)
})