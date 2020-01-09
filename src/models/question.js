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
        type: DataTypes.TEXT,
        validate: {
          isValidDefaultQuestion(value) {
            if (!['health', 'overcoming', 'living', 'coping', 'family', 'friends', 'finance', 'strengths', 'self_esteem', 'life_as_whole'].includes(value)) {
              throw new Error(`${value} is not a valid default question`)
            }
          }
        }
      },
      number: {
        type: DataTypes.SMALLINT,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(100)
      },
      description: {
        type: DataTypes.STRING(200)
      },
      help: {
        type: DataTypes.STRING(1000)
      }
    })

    Question.associate = models => {
      Question.hasMany(models.Answer, {
        onDelete: 'CASCADE'
      })
    }
  
    return Question
  }