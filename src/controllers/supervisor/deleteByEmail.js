const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const asyncRecurser = require('../../utils/asyncRecurser')

module.exports = wrapAsync(async (req, res, next) => {
  const UserGroups = await db.UserGroup.findAll({
    where: {
      respondents: {
        [db.Sequelize.Op.contains]: [req.body.email]
      }
    },
    attributes: ['id', 'respondents']
  })

  await asyncRecurser(UserGroups, (currentGroup, promises) => {
    promises.push(
      currentGroup.update({
        respondents: currentGroup.respondents.filter(email => email !== req.body.email)
      })
    )
  })

  return res.json({
    email: req.body.email,
    amount: UserGroups.length
  })
})