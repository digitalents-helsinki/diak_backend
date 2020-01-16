const { RateLimiterPostgres } = require('rate-limiter-flexible')
const db = require('../models')

const ready = (err) => {
  if (err) {
    console.error(err.stack)
  }
}

module.exports = (options) => new RateLimiterPostgres({
  storeClient: db.sequelize,
  tableName: 'rate_limits',
  ...options
}, ready);