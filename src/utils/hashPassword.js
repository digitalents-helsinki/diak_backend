const argon2 = require('argon2')

module.exports = async (password) => await argon2.hash(password, {
  timeCost: 5,
  memoryCost: 128000,
  parallelism: 2,
  type: argon2.argon2id
})