'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Users',
      'ResultId',
      {
        type: Sequelize.UUID,
        references: {
          model: 'SurveyResults',
          key: 'resultId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Users',
      'resultId'
    )
  }
}