module.exports = (sequelize, DataTypes) => {
  const UserGroup = sequelize.define('UserGroup', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    }
  })

  UserGroup.associate = models => {
    UserGroup.hasMany(models.AnonUser)
  }

  return UserGroup
}
