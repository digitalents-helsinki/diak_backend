module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    adminId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    username: {
      type: DataTypes.TEXT
    },
    password: {
      type: DataTypes.TEXT
    }
  })

  Admin.associate = models => {
    Admin.hasMany(models.Survey, {
      foreignKey: 'surveyId',
      constraints: false
    })
  }

  return Admin
}