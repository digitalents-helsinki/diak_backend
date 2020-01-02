const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')

module.exports = wrapAsync(async (req, res, next) => {
  const UserGroups = await db.UserGroup.findAll({
    where: {
      respondents: {
        [db.Sequelize.Op.contains]: [req.body.email]
      }
    },
    attributes: ['id', 'respondents']
  })

  const removeEmailFromUserGroups = () => new Promise(resolve => 
    (function asyncRecurseOverUserGroups(i = 0, promises = []) {
      const currentGroup = UserGroups[Number(i)]
      if (currentGroup) {
        promises.push(
          currentGroup.update({
            respondents: currentGroup.respondents.filter(email => email !== req.body.email)
          })
        )
        setImmediate(asyncRecurseOverUserGroups, i + 1, promises)
      } else {
        resolve(Promise.all(promises))
      }
    })()
  )

  await removeEmailFromUserGroups()

  return res.json({
    email: req.body.email,
    amount: UserGroups.length
  })
})