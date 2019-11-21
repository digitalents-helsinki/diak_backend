const checkToken = require('../jwt')
const wrapAsync = require('../wrapAsync')
const StatusError = require('../statusError')

module.exports = (app, db) => {
  app.get('/user/info', checkToken, wrapAsync(async (req, res, next) => {
    const User = await db.User.findOne({
      where: {
        email: res.locals.decoded.email
      }
    })

    if (!User) return next(new StatusError("User does not exist", 404))

    return res.json(User)
  })),
  app.post('/user/info/update', checkToken, wrapAsync(async (req, res, next) => {
    const [rows] = await db.User.update({
      name: req.body.personalInfo.name,
      post_number: req.body.personalInfo.postNumber,
      birth_date: req.body.personalInfo.birthDate,
      gender:req.body.personalInfo.gender,
      phone_number: req.body.personalInfo.phoneNumber
    },
    {
      where: {
        email: res.locals.decoded.email
      }
    })
    if (!rows) return next(new StatusError("Failed to update user information", 500))
    
    return res.send("User information updated")
  }))
}