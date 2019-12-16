const db = require('../../models')
const wrapAsync = require('../../utils/wrapAsync')
const { StatusError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const AnonUser = await db.AnonUser.findOne({
    where: {
      entry_hash: req.params.entry_hash
    },
    rejectOnEmpty: true
  })

  const alreadyAnswered = await db.Answer.findOne({
    where: {
      AnonUserId: AnonUser.id,
      final: true
    },
    attributes: ['id']
  })
  if (alreadyAnswered) return next(new StatusError("This one has already answered the survey", 403))

  await AnonUser.update({
    age: req.body.anonymousinfo.age,
    gender:req.body.anonymousinfo.gender,
  })
  
  return res.send("Anonymous information updated")
})