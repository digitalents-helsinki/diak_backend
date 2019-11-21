module.exports = (sequelize, DataTypes) => {
  const AnonUser = sequelize.define('AnonUser', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    /*birth_date: {
      type: DataTypes.DATE
    },*/
    age: {
      type: DataTypes.INTEGER
    },
    gender: {
      type: DataTypes.TEXT
    },
    entry_hash: {
      type: DataTypes.TEXT
    }
  })

  AnonUser.associate = models => {
    AnonUser.belongsTo(models.UserGroup)
    AnonUser.hasOne(models.SurveyResult)
    AnonUser.hasMany(models.Answer)
  }

  return AnonUser
}
