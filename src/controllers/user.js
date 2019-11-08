const checkToken = require('../jwt')
const wrapAsync = require('../wrapAsync')
const StatusError = require('../statusError')

module.exports = (app, db) => {
  app.get('/user/:id', checkToken, wrapAsync(async (req, res, next) => {
    const User = await db.User.findOne({
      where: {
        email: res.locals.decoded.email
      }
    })

    if (!User) return next(new StatusError("User does not exist", 404))

    return res.json(User)
  })),
  app.post('/user/:userId/info/update', checkToken, wrapAsync(async (req, res, next) => {
    const [rows] = await db.User.update({
      name: req.body.personalinfo.name,
      address: req.body.personalinfo.address,
      birth_date: req.body.personalinfo.birthdate,
      gender:req.body.personalinfo.gender,
      phone_number: req.body.personalinfo.phonenumber
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