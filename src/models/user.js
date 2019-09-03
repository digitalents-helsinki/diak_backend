module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    email: {
      type: DataTypes.TEXT
    },
    name: {
      type: DataTypes.TEXT
    },
    gender: {
      type: DataTypes.TEXT
    }
  })

  return User
}