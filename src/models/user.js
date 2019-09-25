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
    }
  })

  User.associate = models => {
    User.hasMany(models.SurveyResult, {
      foreignKey: 'resultId',
      constraints: false
    })
  }

  return User
}
