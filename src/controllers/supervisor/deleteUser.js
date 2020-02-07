const db = require('../../models')
const uuidv4 = require('uuid/v4')
const getRandomBytes = require('../../utils/getRandomBytes')
const hashPassword = require('../../utils/hashPassword')
const wrapAsync = require('../../utils/wrapAsync')

module.exports = wrapAsync(async (req, res, next) => {

  const User = await db.User.findOne({
    where: {
      userId: req.params.userId,
      role: 'user'
    },
    rejectOnEmpty: true
  })

  if (User.password) {
    const password = await getRandomBytes(64)
    const hashedPassword = await hashPassword(Buffer.from(password, 'hex'))

    await User.update({
      email: uuidv4(),
      password: hashedPassword,
      name: null,
      post_number: null,
      phone_number: null,
      age: null,
      gender: null,
      external_id: null,
      external_type: null
    },
    {
      validate: false
    })
  } else {
    await User.destroy()
  }

  return res.sendStatus(204)
})