const StatusError = require('../statusError')

module.exports = (app) => {
  app.use((err, req, res, next) => {
    console.error(err.stack)
    if (err instanceof StatusError) {
      res.status(err.status).send(err.message)
    } else {
      res.sendStatus(500)
    }
  })
}
