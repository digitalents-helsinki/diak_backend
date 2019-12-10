const wrapAsync = require('../wrapAsync')
const { StatusError } = require('../customErrors')

module.exports = (app, db) => {
  app.post('/anonuser/:entry_hash/info/update', wrapAsync(async (req, res, next) => {
    const AnonUser = await db.AnonUser.findOne({
      where: {
        entry_hash: req.params.entry_hash
      },
      rejectOnEmpty: true
    })

    const alreadyAnswered = await db.Answer.findOne({
      where: {
        AnonUserId: AnonUser.id
      }
    })
    if (alreadyAnswered) return next(new StatusError("This one has already answered the survey", 403))

    const [rows] = await db.AnonUser.update({
      age: req.body.anonymousinfo.age,
      gender:req.body.anonymousinfo.gender,
    },
    {
      where: {
        entry_hash: req.params.entry_hash
      }
    })
    if (!rows) return next(new StatusError("Failed to update anonymous information", 500))
    
    return res.send("Anonymous information updated")
  }))
}