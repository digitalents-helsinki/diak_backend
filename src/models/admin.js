const admin = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    username: {
      type: DataTypes.TEXT
    },
    password: {
      type: DataTypes.TEXT
    }
  })
}

module.exports = admin