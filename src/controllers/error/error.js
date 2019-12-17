const { StatusError, AuthError } = require('../../utils/customErrors')
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken')
const { EmptyResultError, ValidationError, UniqueConstraintError } = require('sequelize')

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err) // delegate to default error handler when response has been sent already
  console.error(err.stack)

  switch (err.constructor) {
    case StatusError:
      return res.status(err.status).send(err.message)
    case AuthError:
      if (err.authenticated) {
        return res.status(403).send(err.message)
      } else {
        return res.append('WWW-Authenticate', 'Bearer').status(401).send(err.message)
      }
    case JsonWebTokenError:
    case TokenExpiredError:
      return res.status(401).send(err.message)
    case EmptyResultError:
      return res.sendStatus(404)
    case UniqueConstraintError:
      return res.status(409).json(Object.values(err.fields))
    case ValidationError:
      return res.status(422).json(err.errors.map(error => error.value))
    default:
      switch (true) {
        case err.code === 'EBADCSRFTOKEN': 
          return res.status(403).send('Invalid csrf token')
        default:
          return res.sendStatus(500)
      }
  }
}

