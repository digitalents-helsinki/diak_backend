const uuidv4 = require('uuid/v4')
const { CustomEmail } = require('../../utils/sendMail')
const wrapAsync = require('../../utils/wrapAsync')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const db = require('../../models')

module.exports = wrapAsync(async (req, res) => {
  const [Admin, created] = await db.User.findOrCreate({
    where: {
      $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', req.body.email)),
      role: 'user'
    },
    defaults: {
      userId: uuidv4(),
      role: 'admin',
      email: req.body.email
    }
  })
  if (created || Admin.password === null) {
    if (Admin.password === null) {
      await Admin.update({
        role: 'admin'
      })
    }
    const secret = crypto.createHmac('sha512', process.env.HMAC_KEY).update(`${process.env.JWT_KEY}${Admin.createdAt.getTime()}`).digest('hex')
    const token = jwt.sign(
      {
        sub: Admin.userId,
        aud: 'create',
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      },
      secret
    )
    new CustomEmail(Admin.email, 'Tervetuloa 3X10D -hallinnoitsijaksi',
      `Sinusta on tehty 3X10D -hallinnoitsija. Pääset asettamaan salasanasi allaolevasta linkistä. Linkki toimii viikon ajan.
      <br><br>
      ${process.env.FRONTEND_URL}/password/create/${token}`
    ).send()
  } else {
    await Admin.update({
      role: 'admin'
    })
    new CustomEmail(Admin.email, 'Tervetuloa 3X10D -hallinnoitsijaksi',
      'Sinusta on tehty 3X10D -hallinnoitsija. Löydät hallinnoitsijapaneelin kirjautumalla sisään 3X10D -sovellukseen.'
    ).send()
  }

  return res.json({success: 'true'})
})