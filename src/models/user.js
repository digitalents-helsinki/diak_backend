module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT
    },
    role: {
      type: DataTypes.TEXT
    },
    email: {
      type: DataTypes.TEXT
    },
    password: {
      type: DataTypes.TEXT
    },
    salt: {
      type: DataTypes.TEXT
    },
    address: {
      type: DataTypes.TEXT
    },
    phone_number: {
      type: DataTypes.TEXT
    },
    birth_date: {
      type: DataTypes.DATE
    },
    gender: {
      type: DataTypes.TEXT
    }
  })

  User.associate = models => {
    User.hasMany(models.SurveyResult)
  }

  return User
}
