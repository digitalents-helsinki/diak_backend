exports.StatusError = class StatusError extends Error {
  constructor (message, status = 500) {
    super (message);

    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.status = status;
  }
}

exports.AuthError = class AuthError extends Error {
  constructor (authenticated = false, type = 'Bearer') {
    const message = authenticated ? 'Authorization failed' : 'Authentication failed'
    super (message)

    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.authenticated = authenticated
    this.type = type
  }
}