const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const sendMail = require('../../utils/mail')

module.exports = wrapAsync(async (req, res, next) => {
    
  let transaction
  const sendMails = []
  
  try {
    transaction = await db.sequelize.transaction();
    
    const Survey = await db.Survey.findOne({
      where: {
        surveyId: req.params.surveyId,
        ownerId: res.locals.decoded.sub,
        archived: false,
        [db.Sequelize.Op.or]: [{
          endDate: null
        },
        {
          endDate: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }]
      },
      lock: true,
      rejectOnEmpty: true,
      transaction
    })
    
    const Group = await db.UserGroup.findOne({
      where: {
        SurveySurveyId: Survey.surveyId
      },
      lock: true,
      rejectOnEmpty: true,
      transaction
    })
    
    const emails = [...new Set(req.body.to)]
    const anonEmails = emails.filter(email => !Group.respondents.includes(email))

    await Survey.update({
      name: req.body.name,
      endDate: req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59) : null,
      respondents_size: Survey.anon ? anonEmails.length + Survey.respondents_size : emails.length,
      active: req.body.active
    }, {transaction})

    if (Survey.anon) {
      const formAnonUsers = () => new Promise(resolve => 
        (async function asyncRecurseOverUserEmails(i = 0, promises = []) {
          const email = anonEmails[Number(i)]
          if (email) {
            const entry_hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
            const id = uuidv4()
            promises.push(db.AnonUser.create({ id, entry_hash }, {transaction}), Group.addAnonUser(id, {transaction}))
            sendMails.push([email, 'Uusi kysely',
            `Täytä anonyymi kysely ${process.env.FRONTEND_URL}/anon/questionnaire/${Survey.surveyId}/${entry_hash}
            <br><br>
            ${Survey.message || ''}`])
            setImmediate(asyncRecurseOverUserEmails, i + 1, promises)
          } else {
            resolve(Promise.all(promises))
          }
        })()
      )

      await Promise.all([formAnonUsers, Group.update({respondents: [...Group.respondents, ...anonEmails]}, {transaction})])

    } else {
      const Users = await Group.getUsers({
        attributes: ['userId', 'email'],
        lock: true,
        transaction
      })
      const comparisonUserEmails = Users.map(user => user.email.toLowerCase())
      const addedRespondents = emails.filter(email => !comparisonUserEmails.some(userEmail => userEmail === email))
      const comparisonEmails = emails.map(email => email.toLowerCase())
      const removedRespondents = Users.filter(user => !comparisonEmails.includes(user.email.toLowerCase()))
      const formAddedUsers = () => new Promise(resolve => 
        (async function asyncRecurseOverUserEmails(i = 0, promises = []) {
          const email = addedRespondents[Number(i)]
          if (email) {
            const [User] = await db.User.findOrCreate({
              where: {
                $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', email))
              },
              defaults: {
                userId: uuidv4(),
                email
              },
              attributes: ['userId'],
              lock: true,
              transaction
            })
            promises.push(Group.addUser(User, {transaction}))
            sendMails.push([email, 'Uusi kysely',
            `Täytä kysely ${process.env.FRONTEND_URL}/auth/questionnaire/${Survey.surveyId}
            <br><br>
            ${Survey.message || ''}`])
            setImmediate(asyncRecurseOverUserEmails, i + 1, promises)
          } else {
            resolve(Promise.all(promises))
          }
        })()
      )

      await formAddedUsers()

      const removeUsers = () => new Promise(resolve => 
        (async function asyncRecurseOverUserEmails(i = 0, promises = []) {
          const User = removedRespondents[Number(i)]
          if (User) {
            promises.push(Group.removeUser(User, {transaction}))
            const rows = await db.Answer.destroy({
              where: {
                SurveySurveyId: Survey.surveyId,
                UserUserId: User.userId
              },
              force: true,
              transaction
            })
            if (rows) {
              promises.push(Survey.decrement('responses', {transaction}))
            }
            setImmediate(asyncRecurseOverUserEmails, i + 1, promises)
          } else {
            resolve(Promise.all(promises))
          }
        })()
      )

      await removeUsers()
    }
    
    await transaction.commit()
    
  } catch(err) {
    await transaction.rollback()
    return next(err)
  }
  if (transaction.finished === 'commit') {
    sendMails.forEach(params => sendMail(...params))
    const Survey = await db.Survey.findByPk(req.params.surveyId, {
      include: {
        model: db.UserGroup,
        include: {
          model: db.User,
          attributes: ['email']
        }
      }
    })
    if (Survey) return res.json(Survey)
    else return res.sendStatus(410)
  }
})