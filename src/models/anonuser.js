module.exports = (sequelize, DataTypes) => {
  const AnonUser = sequelize.define('AnonUser', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    userId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    entry_hash: {
      type: DataTypes.TEXT
    }
  })

  AnonUser.associate = models => {
    AnonUser.hasOne(models.UserGroup)
    AnonUser.hasMany(models.Survey)
  }

  return AnonUser
}
