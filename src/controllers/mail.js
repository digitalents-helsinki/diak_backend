const Mailer = require('../mail')

module.exports = app => {
  app.post('/sendmail/', (req, res) => {
    req.body.to.map(to => {
      if (req.body.anon === true) {
        Mailer(
          to,
          'Uusi kysely',
          'Täytä anonyymi kysely http://localhost:8080/questionnaire/' +
            req.body.id
        )
      } else {
        Mailer(to, 'Uusi kysely', 'Täytä kysely http://localhost:8080/login/')
      }
    })
    res.json('ok')
  })
}
