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
      type: DataTypes.TEXT
    },
    phone_number: {
      type: DataTypes.TEXT
    },
    age: {
      type: DataTypes.INTEGER
    },
    gender: {
      type: DataTypes.TEXT
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
