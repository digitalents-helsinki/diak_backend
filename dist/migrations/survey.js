'use strict';
module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('Surveys', {
            surveyId: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            resultId: {
                type: Sequelize.UUID,
                references: {
                    model: 'SurveyResults',
                    key: 'resultId'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            name: {
                type: Sequelize.TEXT
            },
            anon: {
                type: Sequelize.BOOLEAN
            },
            startDate: {
                type: Sequelize.DATE
            },
            endDate: {
                type: Sequelize.DATE
            },
            respondents_size: {
                type: Sequelize.INTEGER
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable('Surveys');
    }
};
