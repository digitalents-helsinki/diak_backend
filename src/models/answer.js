module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    answerId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    value: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.TEXT
    }
  })

  Answer.associate = models => {
    Answer.belongsTo(models.Survey)
    Answer.belongsTo(models.Question)
    Answer.belongsTo(models.User)
    Answer.belongsTo(models.AnonUser)
  }

  return Answer
}