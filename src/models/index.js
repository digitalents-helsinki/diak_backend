const Sequelize = require('sequelize')
let db = {}

let sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    dialect: 'postgres',
    logging: false
  }
)

let models = {
  Admin: sequelize.import('./admin'),
  UserGroup: sequelize.import('./usergroup'),
  User: sequelize.import('./user'),
  SurveyResult: sequelize.import('./result'),
  Survey: sequelize.import('./survey')
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.models = models
db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db