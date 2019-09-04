'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'SurveyResults',
      'SurveyId',
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
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'SurveyResults',
      'SurveyId'
    )
  }
};
