const wrapAsync = require('../common/wrapAsync')
const db = require('../../models')
const { StatusError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const User = await db.User.findOne({
    where: {
      userId: res.locals.decoded.sub
    }
  })

  if (!User) return next(new StatusError("User does not exist", 404))

  return res.json(User)
})