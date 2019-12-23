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
      type: DataTypes.STRING(100)
    },
    message: {
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
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    responses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    final: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    surveyGroupId: {
      type: DataTypes.UUID
    }
  },
  {
    defaultScope: {
      where: {
        final: true
      }
    }
  })

  Survey.associate = models => {
    Survey.belongsTo(models.User, {
      foreignKey: 'ownerId'
    })
    Survey.hasOne(models.UserGroup, {
      onDelete: 'CASCADE'
    })
    Survey.hasMany(models.Question, {
      onDelete: 'CASCADE'
    })
  }

  return Survey
}