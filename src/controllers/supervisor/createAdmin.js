const uuidv4 = require('uuid/v4')
const argon2 = require('argon2')
const sendMail = require('../../utils/mail')
const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')

module.exports = wrapAsync(async (req, res) => {
  const hashedPassword = await argon2.hash(req.body.password, {
    timeCost: 10,
    memoryCost: 256000,
    parallelism: 8,
    type: argon2.argon2id
  })
  await db.User.create({
    userId: uuidv4(),
    role: 'admin',
    email: req.body.username,
    password: hashedPassword
  })
  sendMail(req.body.username, 'Tervetuloa', 'Olet nyt hallinnoitsija.')
  res.json({success: 'true'})
})