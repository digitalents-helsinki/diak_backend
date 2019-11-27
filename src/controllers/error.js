const StatusError = require('../statusError')

module.exports = (app, db) => {
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err)
    }
    console.error(err.stack)
    if (err instanceof StatusError) {
      return res.status(err.status).send(err.message)
    }
    if (err instanceof db.Sequelize.EmptyResultError) {
      return res.sendStatus(404)
    }
    if (err instanceof db.Sequelize.ValidationError) {
      return res.append('X-Status-Reason', 'Validation failed').sendStatus(422)
    }
    
    return res.sendStatus(500)
  })
}
