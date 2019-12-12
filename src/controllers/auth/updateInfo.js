const wrapAsync = require('../common/wrapAsync')
const db = require('../../models')
const { StatusError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
  const [rows] = await db.User.update({
    name: req.body.personalInfo.name,
    post_number: req.body.personalInfo.postNumber,
    birth_date: req.body.personalInfo.birthDate,
    gender:req.body.personalInfo.gender,
    phone_number: req.body.personalInfo.phoneNumber
  },
  {
    where: {
      userId: res.locals.decoded.sub
    }
  })
  if (!rows) return next(new StatusError("Failed to update user information", 500))
  
  return res.send("User information updated")
})