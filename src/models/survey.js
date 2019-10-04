module.exports = (sequelize, DataTypes) => {
  const Survey = sequelize.define('Survey', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    surveyId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT
    },
    anon: {
      type: DataTypes.BOOLEAN
    },
    startDate: {
      type: DataTypes.DATE
    },
    endDate: {
      type: DataTypes.DATE
    },
    respondents_size: {
      type: DataTypes.INTEGER
    },
    archived: {
      type: DataTypes.BOOLEAN
    },
    active: {
      type: DataTypes.BOOLEAN
    }
  })

  Survey.associate = models => {
    Survey.belongsTo(models.Admin)
    Survey.hasMany(models.User)
    Survey.hasOne(models.UserGroup)
    Survey.hasMany(models.Question)
  }

  return Survey
}