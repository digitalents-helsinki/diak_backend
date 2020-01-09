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
        type: DataTypes.INTEGER,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: false
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