module.exports = (sequelize, DataTypes) => {
  const UserGroup = sequelize.define('UserGroup', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    groupId: {
      type: DataTypes.UUID,
      primaryKey: true
    }
  })

  UserGroup.associate = models => {
    UserGroup.hasOne(models.Admin)
    UserGroup.hasMany(models.AnonUser)
    UserGroup.belongsTo(models.Survey)
  }

  return UserGroup
}
