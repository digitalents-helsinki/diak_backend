module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn('Answers', 'description', {
        type: Sequelize.STRING(2000)
      }, {transaction})
      await queryInterface.removeConstraint('Answers', 'Answers_QuestionQuestionId_fkey', {transaction})
      await queryInterface.addConstraint('Answers', ['QuestionQuestionId'], {
        type: 'FOREIGN KEY',
        name: 'Answers_QuestionQuestionId_fkey',
        references: {
          table: 'Questions',
          field: 'questionId'
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
