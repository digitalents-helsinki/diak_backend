module.exports = (sequelize, DataTypes) => {
  const Survey = sequelize.define('Survey', {
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
    }
  })

  return Survey
}