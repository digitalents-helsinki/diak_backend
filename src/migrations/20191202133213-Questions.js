module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn('Questions', 'title', {
        type: Sequelize.STRING(100)
      }, {transaction})
      await queryInterface.changeColumn('Questions', 'description', {
        type: Sequelize.STRING(200)
      }, {transaction})
      await queryInterface.changeColumn('Questions', 'help', {
        type: Sequelize.STRING(1000)
      }, {transaction})
      await queryInterface.removeConstraint('Questions', 'Questions_SurveySurveyId_fkey', {transaction})
      await queryInterface.addConstraint('Questions', ['SurveySurveyId'], {
        type: 'FOREIGN KEY',
        name: 'Questions_SurveySurveyId_fkey',
        references: {
          table: 'Surveys',
          field: 'surveyId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction
      })

      await transaction.commit()
    } catch(err) {
      await transaction.rollback()
      console.error(err)
    }
  },

  async down(queryInterface, Sequelize) {
  }
};
