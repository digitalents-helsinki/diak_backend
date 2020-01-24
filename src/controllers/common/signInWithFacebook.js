const wrapAsync = require('../../utils/wrapAsync')
const generateAuthToken = require('../../utils/generateAuthToken')
const uuidv4 = require('uuid/v4')
const db = require('../../models')
const getRandomBytes = require('../../utils/getRandomBytes')
const hashPassword = require('../../utils/hashPassword')
const { request } = require('gaxios')

module.exports = wrapAsync(async (req, res, next) => {
  const { data: { data: { user_id, is_valid, app_id, scopes, expires_at } } } = await request({
    url: 'https://graph.facebook.com/v5.0/debug_token',
    params: {
      input_token: req.body.accessToken,
      access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
    }
  })

  if (!is_valid || app_id !== process.env.FACEBOOK_APP_ID || !scopes.includes('email') || expires_at < (Date.now() / 1000)) {
    return next(new Error('Facebook Access Token is invalid')) // I'm not sure if this check is needed but doing it anyway
  }

  const { data: { email, id } } = await request({
    url:  `https://graph.facebook.com/v5.0/${user_id}`,
    params: {
      fields: 'email',
      access_token: req.body.accessToken
    }
  })

  if (!email || id !== user_id) {
    return next(new Error("Facebook didn't return proper data")) // more paranoid checks
  }

  let User = await db.User.findOne({
    where: {
      external_id: user_id,
      external_type: 'FACEBOOK'
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
        external_id: user_id,
        external_type: 'FACEBOOK'
      })
    } else {
      User = await db.User.create({
        userId: uuidv4(),
        password: hashedPassword,
        email,
        external_id: user_id,
        external_type: 'FACEBOOK'
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
    authInfo: {
      userId: User.userId, 
      email: User.email,
      token: token, 
      role: User.role
    },
    personalInfo: {
      name: User.name,
      post_number: User.post_number,
      phone_number: User.phone_number,
      age: User.age,
      gender: User.gender
    }
  })
})