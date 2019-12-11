const uuidv4 = require('uuid/v4')
const argon2 = require('argon2')
const sendMail = require('../../mail')
const wrapAsync = require('../../wrapAsync')
const db = require('../../models')

module.exports = wrapAsync(async (req, res) => {
  const hashedPassword = await argon2.hash(req.body.password)
  await db.User.create({
    userId: uuidv4(),
    role: 'admin',
    email: req.body.username,
    password: hashedPassword
  })
  sendMail(req.body.username, 'Tervetuloa', 'Olet nyt hallinnoitsija.')
  res.json({success: 'true'})
})