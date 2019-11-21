const StatusError = require('../statusError')

module.exports = (app) => {
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err)
    }
    console.error(err.stack)
    if (err instanceof StatusError) {
      return res.status(err.status).send(err.message)
    } else {
      return res.sendStatus(500)
    }
  })
}
