const uuidv4 = require('uuid/v4')
const { randomBytes } = require('crypto')
const argon2 = require('argon2')
const sendMail = require('../mail')

module.exports = (app, db) => {
  app.get('/admins/', (req, res) => {
    db.User.findAll({
      where: {
        role: 'admin'
      }
    }).then((result) => res.json(result))
  })
  app.post("/admin/create", async (req, res) => {
    const salt = randomBytes(32)
    const hashedPassword = await argon2.hash(req.body.password, { salt })
    const User = await db.User.create({
      userId: uuidv4(),
      role: 'admin',
      email: req.body.username,
      password: hashedPassword,
      salt: salt.toString('hex')
    })
    sendMail(req.body.username, 'Tervetuloa', 'Olet nyt hallinnoitsija.')
    res.json({success: 'true'})
  })
  app.post("/admin/delete", (req, res) => {
    db.User.destroy({
      where: {
        role: 'admin',
        userId: req.body.id
      }
    })
    res.json({status: 'ok'})
  })
}