module.exports = (sequelize, DataTypes) => {
    const Question = sequelize.define('Question', {
      /*
        Sequelize will create createdAt and updatedAt fields automatically.
      */
      questionId: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      name: {
        type: DataTypes.TEXT
      },
      number: {
        type: DataTypes.INTEGER
      },
      title: {
        type: DataTypes.TEXT
      },
      description: {
        type: DataTypes.TEXT
      },
      help: {
        type: DataTypes.TEXT
      }
    })

    Question.associate = models => {
      Question.hasMany(models.Answer)
    }
  
    return Question
  }