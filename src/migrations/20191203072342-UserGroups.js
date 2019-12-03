module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeConstraint('UserGroups', 'UserGroups_SurveySurveyId_fkey', {transaction})
      await queryInterface.addConstraint('UserGroups', ['SurveySurveyId'], {
        type: 'FOREIGN KEY',
        name: 'UserGroups_SurveySurveyId_fkey',
        references: {
          table: 'Surveys',
          field: 'surveyId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction
      })

      await queryInterface.changeColumn('UserGroups', 'respondents', {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        validate: {
          caseInsensitivelyUniqueElements(array) {
            if (array.some((Element, Index) => array.some((element, index) => Index !== index && Element.toLowerCase() === element.toLowerCase()))) {
              throw new Error("All array elements are not case insensitively unique")
            }
          },
          elementsAreEmail(array) {
            array.forEach(email => {
              if (!queryInterface.sequelize.Validator.isEmail(email)) {
                throw new Error("All array elements are not emails")
              }
            })
          }
        }
      }, {transaction})

      await transaction.commit()
    } catch(err) {
      await transaction.rollback()
      console.error(err)
    }
  },

  async down(queryInterface, Sequelize) {
  }
};
