const { randomBytes } = require('crypto')

module.exports = (size) => new Promise((resolve, reject) => randomBytes(size, (err, buf) => err ? reject(err) : resolve(buf.toString('hex'))))