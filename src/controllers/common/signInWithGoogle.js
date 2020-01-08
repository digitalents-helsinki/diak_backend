const wrapAsync = require('../../utils/wrapAsync')
const verifyGoogleIdToken = require('../../utils/verifyGoogleIdToken')
const generateAuthToken = require('../../utils/generateAuthToken')
const uuidv4 = require('uuid/v4')
const db = require('../../models')
const getRandomBytes = require('../../utils/getRandomBytes')
const hashPassword = require('../../utils/hashPassword')

module.exports = wrapAsync(async (req, res, next) => {
  const { sub, email } = await verifyGoogleIdToken(req.body.id_token)

  let User = await db.User.findOne({
    where: {
      external_id: sub,
      external_type: 'GOOGLE'
    }
  })

  if (!User) {
    const password = await getRandomBytes(64)
    const hashedPassword = await hashPassword(password)

    User = await db.User.findOne({
      where: {
        $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', email)),
        password: null,
        role: 'user'
      }
    })

    if (User) {
      await User.update({
        password: hashedPassword,
        external_id: sub,
        external_type: 'GOOGLE'
      })
    } else {
      User = await db.User.create({
        userId: uuidv4(),
        password: hashedPassword,
        email,
        external_id: sub,
        external_type: 'GOOGLE'
      })
    }
  }

  const { token, ctx } = await generateAuthToken({
    sub: User.userId,
    role: User.role
  })

  return res.cookie('Ctx', ctx, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }).json({
    userId: User.userId, 
    email: User.email,
    token: token, 
    role: User.role,
    personalInfo: {
      name: User.name,
      post_number: User.post_number,
      phone_number: User.phone_number,
      age: User.age,
      gender: User.gender
    }
  })
})