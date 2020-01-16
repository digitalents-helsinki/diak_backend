const { randomBytes } = require('crypto')

module.exports = async (size) => await new Promise((resolve, reject) => randomBytes(size, (err, buf) => err ? reject(err) : resolve(buf.toString('hex'))))