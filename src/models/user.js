module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
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
    },
    roleIsAdmin: {
      type: DataTypes.BOOLEAN
    }
  },
  {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.SurveyResults, {
          foreignKey: 'resultId'
        })
      }
    }
  })

  return User
}