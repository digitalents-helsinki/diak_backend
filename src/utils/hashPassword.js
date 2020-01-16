const argon2 = require('argon2')

module.exports = async (password) => await argon2.hash(password, {
  timeCost: 10,
  memoryCost: 256000,
  parallelism: 2,
  type: argon2.argon2id
})