module.exports = (err, req, res, next) => {
  const message = err.message
  const location = req.url
  const subject = res.locals.decoded ? res.locals.decoded.sub || req.ip : req.ip
  process.env.NODE_ENV === 'production' ? console.error('Error:', message, 'at', location, 'by', subject) : console.error(err.stack)
  return next(err)
}

