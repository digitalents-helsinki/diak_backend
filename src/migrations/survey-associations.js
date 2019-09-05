'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn(
        'SurveyResults',
        'surveyId',
        {
          type: Sequelize.UUID,
          references: {
            model: 'Surveys',
            key: 'surveyId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }
      )
      await queryInterface.addColumn(
        'SurveyResults',
        'userId',
        {
          type: Sequelize.UUID,
          references: {
            model: 'Users',
            key: 'userId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }
      )
      return Promise.resolve()
    } catch (err) {
      return Promise.reject(err)
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'SurveyResults',
      'surveyId'
    )
  }
};
