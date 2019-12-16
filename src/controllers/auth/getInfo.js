const wrapAsync = require('../common/wrapAsync')
const db = require('../../models')

module.exports = wrapAsync(async (req, res, next) => {
  const User = await db.User.findOne({
    where: {
      userId: res.locals.decoded.sub
    },
    attributes: ['name', 'post_number', 'phone_number', 'age', 'gender'],
    rejectOnEmpty: true
  })

  return res.json(User)
})