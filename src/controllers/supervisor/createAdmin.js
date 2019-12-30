const uuidv4 = require('uuid/v4')
const hashPassword = require('../../utils/hashPassword')
const sendMail = require('../../utils/mail')
const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')

module.exports = wrapAsync(async (req, res) => {
  const hashedPassword = await hashPassword(req.body.password)
  await db.User.create({
    userId: uuidv4(),
    role: 'admin',
    email: req.body.username,
    password: hashedPassword
  })
  sendMail(req.body.username, 'Tervetuloa', 'Olet nyt hallinnoitsija.')
  res.json({success: 'true'})
})