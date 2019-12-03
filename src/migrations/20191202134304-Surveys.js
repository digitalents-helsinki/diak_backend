module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn('Surveys', 'name', {
        type: Sequelize.STRING(100)
      }, {transaction})
      
      await queryInterface.changeColumn('Surveys', 'archived', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }, {transaction})

      await queryInterface.changeColumn('Surveys', 'active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }, {transaction})

      await queryInterface.removeColumn('Surveys', 'AdminAdminId', {transaction})

      await queryInterface.addConstraint('Surveys', ['ownerId'], {
        type: 'FOREIGN KEY',
        name: 'Surveys_ownerId_fkey',
        references: {
          table: 'Users',
          field: 'userId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
