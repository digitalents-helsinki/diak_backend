const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')

module.exports = wrapAsync(async (req, res, next) => {

  const User = await db.User.findByPk(res.locals.decoded.sub, {
    rejectOnEmpty: true
  })

  await User.update({
    name: req.body.personalInfo.name,
    post_number: req.body.personalInfo.postNumber,
    age: req.body.personalInfo.age,
    gender:req.body.personalInfo.gender,
    phone_number: req.body.personalInfo.phoneNumber
  })
  
  return res.send("User information updated")
})