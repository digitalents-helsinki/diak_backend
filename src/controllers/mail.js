const Mailer = require('../mail')

module.exports = (app) => {
  app.post("/sendmail/", (req, res) => {
    req.body.to.map(to => {
      Mailer(to, 'Täytä kysely', 
      'Kyselymme https://stupefied-joliot-1a8c88.netlify.com/')
    })
    res.json('ok')
  })
}