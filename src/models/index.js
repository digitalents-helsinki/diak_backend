const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')

const basename = path.basename(__filename)
let db = {}

let sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DATABASE_URL,
    port: process.env.DATABASE_PORT,
    dialect: 'postgres'
  },
  {
    dialectOptions: {
      ssl: true
    }
  }
)

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;