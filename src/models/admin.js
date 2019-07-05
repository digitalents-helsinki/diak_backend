module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('admin', {
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

  return Admin
}