module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn('Users', 'email', {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          isEmail: true
        }
      }, {transaction})

      await queryInterface.removeConstraint('Users', 'Users_email_key', {transaction})

      await transaction.commit()
    } catch(err) {
      await transaction.rollback()
      console.error(err)
    }
  },

  async down(queryInterface, Sequelize) {
  }
};
