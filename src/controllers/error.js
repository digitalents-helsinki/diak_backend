const { StatusError, AuthError } = require('../customErrors')
const { JsonWebTokenError } = require('jsonwebtoken')
const { EmptyResultError, ValidationError } = require('sequelize')

module.exports = (app) => {
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err)
    }
    console.error(err.stack)
    if (err instanceof StatusError) {
      return res.status(err.status).send(err.message)
    }
    if (err instanceof AuthError) {
      if (err.authenticated) {
        return res.status(403).send(err.message)
      } else {
        return res.append('WWW-Authenticate', 'Bearer').status(401).send(err.message)
      }
    }
    if (err instanceof JsonWebTokenError) {
      return res.status(401).send(err.message)
    }
    if (err instanceof EmptyResultError) {
      return res.sendStatus(404)
    }
    if (err instanceof ValidationError) {
      return res.status(422).send("Validation failed")
    }
    
    return res.sendStatus(500)
  })
}
