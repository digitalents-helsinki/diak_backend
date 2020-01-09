module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'user'
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.TEXT
    },
    post_number: {
      type: DataTypes.STRING
    },
    phone_number: {
      type: DataTypes.STRING
    },
    age: {
      type: DataTypes.SMALLINT
    },
    gender: {
      type: DataTypes.STRING(6)
    },
    external_id: {
      type: DataTypes.TEXT
    },
    external_type: {
      type: DataTypes.TEXT,
      validate: {
        allowedProviders(value) {
          if (!['GOOGLE', 'FACEBOOK'].includes(value)) throw new Error(`Provider ${value} is not allowed`)
        }
      }
    }
  },
  {
    indexes: [{ 
      unique: true,   
      name: 'unique_email',  
      fields: [sequelize.fn('lower', sequelize.col('email'))]   
    }]
  })

  User.associate = models => {
    User.belongsToMany(models.UserGroup, {
      through: 'UserGroup_User'
    })
  }

  return User
}
