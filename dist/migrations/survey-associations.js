'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield queryInterface.addColumn('SurveyResults', 'surveyId', {
                type: Sequelize.UUID,
                references: {
                    model: 'Surveys',
                    key: 'surveyId'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            });
            yield queryInterface.addColumn('SurveyResults', 'userId', {
                type: Sequelize.UUID,
                references: {
                    model: 'Users',
                    key: 'userId'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
            return Promise.resolve();
        }
        catch (err) {
            return Promise.reject(err);
        }
    }),
    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn('SurveyResults', 'surveyId');
    }
};
