'use strict';
module.exports = (sequelize, DataTypes) => {
    const Survey = sequelize.define('Survey', {
        /*
        Sequelize will create createdAt and updatedAt fields automatically.
      */
        surveyId: {
            allowNull: false,
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            autoIncrement: false
        },
        name: {
            type: DataTypes.TEXT
        },
        anon: {
            type: DataTypes.BOOLEAN
        },
        startDate: {
            type: DataTypes.DATE
        },
        endDate: {
            type: DataTypes.DATE
        },
        respondents_size: {
            type: DataTypes.INTEGER
        }
    }, {});
    Survey.associate = function (models) {
        Survey.hasMany(models.SurveyResult, {
            foreignKey: 'resultId'
        });
    };
    return Survey;
};
