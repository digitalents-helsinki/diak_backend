exports.StatusError = class StatusError extends Error {
  constructor(message, status = 500) {
    super (message);

    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.status = status;
  }
}

exports.AuthError = class AuthError extends Error {
  constructor(reason) {
    super(`Auth failed: ${reason}`)

    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.reason = reason
  }
}