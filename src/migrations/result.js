'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('SurveyResults', {
      resultId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      number_of_returns: {
        type: Sequelize.INTEGER
      },
      health: {
        type: Sequelize.INTEGER
      },
      overcoming: {
        type: Sequelize.INTEGER
      },
      living: {
        type: Sequelize.INTEGER
      },
      coping: {
        type: Sequelize.INTEGER
      },
      family: {
        type: Sequelize.INTEGER
      },
      friends: {
        type: Sequelize.INTEGER
      },
      finance: {
        type: Sequelize.INTEGER
      },
      strengths: {
        type: Sequelize.INTEGER
      },
      self_esteem: {
        type: Sequelize.INTEGER
      },
      life_as_whole: {
        type: Sequelize.INTEGER
      },
      health_desc: {
        type: Sequelize.TEXT
      },
      overcoming_desc: {
        type: Sequelize.TEXT
      },
      living_desc: {
        type: Sequelize.TEXT
      },
      coping_desc: {
        type: Sequelize.TEXT
      },
      family_desc: {
        type: Sequelize.TEXT
      },
      friends_desc: {
        type: Sequelize.TEXT
      },
      finance_desc: {
        type: Sequelize.TEXT
      },
      strengths_desc: {
        type: Sequelize.TEXT
      },
      self_esteem_desc: {
        type: Sequelize.TEXT
      },
      life_as_whole_desc: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('SurveyResults')
  }
}
