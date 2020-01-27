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
      type: DataTypes.STRING(100),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT
    },
    anon: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE
    },
    endDate: {
      type: DataTypes.DATE
    },
    respondents_size: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    responses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    final: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    emailsSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    surveyGroupId: {
      type: DataTypes.UUID
    }
  },
  {
    validate: {
      startDateBeforeEndDate() {
        if ((this.startDate !== null) && (this.endDate !== null)) {
          if (this.endDate.getTime() < this.startDate.getTime()) {
            throw new Error("Start date cannot be before end date!")
          }
        }
      }
    },
    defaultScope: {
      where: {
        final: true
      }
    }
  })

  Survey.associate = models => {
    Survey.belongsTo(models.User, {
      foreignKey: {
        name: 'ownerId',
        allowNull: false
      }
    })
    Survey.hasOne(models.UserGroup, {
      onDelete: 'CASCADE'
    })
    Survey.hasMany(models.Question, {
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false
      }
    })
  }

  return Survey
}