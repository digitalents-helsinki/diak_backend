module.exports = (sequelize, DataTypes) => {
  const AnonUser = sequelize.define('AnonUser', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    age: {
      type: DataTypes.SMALLINT
    },
    gender: {
      type: DataTypes.STRING(6)
    },
    entry_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  })

  AnonUser.associate = models => {
    AnonUser.belongsTo(models.UserGroup, {
      onDelete: 'CASCADE'
    })
  }

  return AnonUser
}
