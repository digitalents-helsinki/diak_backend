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
      validate: {
        caseInsensitivelyUniqueElements(array) {
          if (array.some((Element, Index) => array.some((element, index) => Index !== index && Element.toLowerCase() === element.toLowerCase()))) {
            throw new Error("All array elements are not case insensitively unique")
          }
        },
        elementsAreEmail(array) {
          array.forEach(email => {
            if (!sequelize.Validator.isEmail(email)) {
              throw new Error("All array elements are not emails")
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
