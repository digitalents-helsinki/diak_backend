const wrapAsync = require('../wrapAsync')
const StatusError = require('../statusError')

module.exports = (app, db) => {
  app.get('/anonuser/:entry_hash', wrapAsync(async (req, res, next) => {
    const AnonUser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.params.entry_hash
      }
    })

    if (!AnonUser) return next(new StatusError("User does not exist", 404))

    return res.json(AnonUser)
  })),
  app.post('/anonuser/:entry_hash/info/update', wrapAsync(async (req, res, next) => {
    const [rows] = await db.AnonUser.update({
      age: req.body.anonymousinfo.age,
      gender:req.body.anonymousinfo.gender,
    },
    {
      where: {
        entry_hash: req.params.entry_hash
      }
    })
    if (!rows) return next(new StatusError("Failed to update user information", 500))
    
    return res.send("User information updated")
  }))
}