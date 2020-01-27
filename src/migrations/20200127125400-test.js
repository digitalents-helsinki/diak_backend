const db = require('../models')

module.exports = {
  up(queryInterface) {
    return queryInterface.dropAllTables().then(() => db.sequelize.sync({ force: true }))
  }
}