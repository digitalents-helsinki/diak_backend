module.exports = fn => (...args) => Promise.resolve(fn(...args)).catch(args[2])

/* wraps around async middleware, catches rejected promises and calls next() with the error as the first argument */