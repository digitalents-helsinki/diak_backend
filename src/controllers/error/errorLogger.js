module.exports = (err, req, res, next) => {
  const message = err.message
  const location = req.url
  const subject = res.locals.decoded ? res.locals.decoded.sub || req.ip : req.ip
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', message, 'at', location, 'by', subject)
  } else if (!res.headersSent) {
    console.error(err.stack) // log in development if response hasn't been sent
  }
  return next(err)
}

