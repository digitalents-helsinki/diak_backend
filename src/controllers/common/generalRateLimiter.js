const createRateLimiter = require('../../utils/createRateLimiter')
const { RateLimiterError } = require('../../utils/customErrors')
const wrapAsync = require('../../utils/wrapAsync')

const rateLimiter = createRateLimiter({
  keyPrefix: 'general_rate_limit',
  points: 5, // Number of points
  duration: 1, // Per second(s)
  blockDuration: 10, // Block for 10 seconds if consumed more than `points`
  inmemoryBlockOnConsumed: 30, // Block mega spam in memory to avoid database dysfunction
  inmemoryBlockDuration: 60
});

module.exports = wrapAsync(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip)
    return next()
  } catch(err) {
    return err instanceof Error ? next(err) : next(new RateLimiterError(err))
  }
})