const Sequelize = require('sequelize')

const sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    dialect: 'postgres'
  }
)

const models = {
  Admin: sequelize.import('./admin'),
  UserGroup: sequelize.import('./usergroup'),
  AnonUser: sequelize.import('./anonuser'),
  SurveyResult: sequelize.import('./result')
}

module.exports = {
  sequelize,
  models
}