const { StatusError, AuthError, RateLimiterError } = require('../../utils/customErrors')
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken')
const { EmptyResultError, ValidationError, UniqueConstraintError } = require('sequelize')

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err) // delegate to default error handler when response has been sent already

  switch (err.constructor) {
    case RateLimiterError:
      return res.append('Retry-After', Math.round(err.rateLimiterRes.msBeforeNext / 1000) || 1).status(429).send(err.message)
    case StatusError:
      return res.status(err.status).send(err.message)
    case AuthError:
      switch(err.reason) {
        case 'invalid':
          return res.append('WWW-Authenticate', 'Bearer').sendStatus(401)
        case 'ctx':
          return res.status(401).send("Invalid context")
        default:
          return res.sendStatus(403)
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

