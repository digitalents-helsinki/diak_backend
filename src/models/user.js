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
      type: DataTypes.TEXT,
      unique: true
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
    User.belongsToMany(models.UserGroup, {
      through: 'UserGroup_User'
    })
  }

  return User
}
