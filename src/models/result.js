'use strict'

module.exports = (sequelize, DataTypes) => {
  const SurveyResult = sequelize.define(
    'SurveyResult',
    {
      /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
      resultId: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      number_of_returns: {
        type: DataTypes.INTEGER
      },
      health: {
        type: DataTypes.INTEGER
      },
      overcoming: {
        type: DataTypes.INTEGER
      },
      living: {
        type: DataTypes.INTEGER
      },
      coping: {
        type: DataTypes.INTEGER
      },
      family: {
        type: DataTypes.INTEGER
      },
      friends: {
        type: DataTypes.INTEGER
      },
      finance: {
        type: DataTypes.INTEGER
      },
      strengths: {
        type: DataTypes.INTEGER
      },
      self_esteem: {
        type: DataTypes.INTEGER
      },
      life_as_whole: {
        type: DataTypes.INTEGER
      },
      health_desc: {
        type: DataTypes.TEXT
      },
      overcoming_desc: {
        type: DataTypes.TEXT
      },
      living_desc: {
        type: DataTypes.TEXT
      },
      coping_desc: {
        type: DataTypes.TEXT
      },
      family_desc: {
        type: DataTypes.TEXT
      },
      friends_desc: {
        type: DataTypes.TEXT
      },
      finance_desc: {
        type: DataTypes.TEXT
      },
      strengths_desc: {
        type: DataTypes.TEXT
      },
      self_esteem_desc: {
        type: DataTypes.TEXT
      },
      life_as_whole_desc: {
        type: DataTypes.TEXT
      }
    },
    {}
  )
  SurveyResult.associate = function (models) {
    SurveyResult.belongsTo(models.Survey)
    SurveyResult.belongsTo(models.User)
  }

  return SurveyResult
}
