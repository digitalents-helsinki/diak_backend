module.exports = (sequelize, DataTypes) => {
  const UserGroup = sequelize.define('UserGroup', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    respondents: {
      type: DataTypes.ARRAY(DataTypes.TEXT)
    }
  })

  UserGroup.associate = models => {
    UserGroup.hasMany(models.AnonUser)
    UserGroup.belongsToMany(models.User, {
      through: 'UserGroup_User'
    })
    UserGroup.belongsTo(models.Survey)
  }

  return UserGroup
}
