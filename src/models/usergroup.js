module.exports = (sequelize, DataTypes) => {
  const UserGroup = sequelize.define('UserGroup', {
    /*
      Sequelize will create createdAt and updatedAt fields automatically.
    */
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    respondents: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      validate: {
        caseInsensitivelyUniqueElements(array) {
          array.forEach((Element, Index) => array.forEach((element, index) => {
            if (Index !== index && Element.toLowerCase() === element.toLowerCase()) {
              throw new Error(`${Element} and ${element} are case insensitive duplicates`)
            }
          }))
        },
        elementsAreEmail(array) {
          array.forEach(email => {
            if (!sequelize.Validator.isEmail(email)) {
              throw new Error(`${email} is not a valid email address`)
            }
          })
        }
      }
    }
  })

  UserGroup.associate = models => {
    UserGroup.hasMany(models.AnonUser)
    UserGroup.belongsToMany(models.User, {
      through: 'UserGroup_User'
    })
    UserGroup.belongsTo(models.Survey)
  }

  return UserGroup
}
