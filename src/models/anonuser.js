const anonUser = (sequelize, DataTypes) => {
  const AnonUser = sequelize.define('AnonUser', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    entry_hash: {
      type: DataTypes.TEXT
    }
  })

  AnonUser.associate = models => {
    AnonUser.hasOne(models.UserGroup)
  }
}

module.exports = anonUser