const wrapAsync = require('../common/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const sendMail = require('../../utils/mail')
const { StatusError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {
    
  let transaction
  const sendMails = []
  
  try {
    transaction = await db.sequelize.transaction();
    
    const Survey = await db.Survey.findOne({
      where: {
        surveyId: req.params.surveyId,
        ownerId: res.locals.decoded.sub
      },
      lock: true,
      rejectOnEmpty: true,
      transaction
    })

    if (Survey.archived) throw new StatusError("Survey has been archived and thus it cannot be modified", 403)
    
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
      await Group.update({respondents: [...Group.respondents, ...anonEmails]}, {transaction})
      for (const to of anonEmails) {
        const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
        let anonuser = await db.AnonUser.create({
          id: uuidv4(),
          entry_hash: hash
        }, {transaction})
        await Group.addAnonUser(anonuser, {transaction})
        sendMails.push([to, 'Uusi kysely', 
        `Täytä anonyymi kysely ${process.env.FRONTEND_URL}/anon/questionnaire/${Survey.surveyId}/${hash}
        <br><br>
        ${Survey.message}
        `])
      }
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
      for (const to of addedRespondents) {
        const [User] = await db.User.findOrCreate({
          where: {
            $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', to))
          },
          attributes: ['userId'],
          defaults: {
            userId: uuidv4(),
            email: to
          },
          lock: true,
          transaction
        })
        await Group.addUser(User, {transaction})
        sendMails.push([to, 'Uusi kysely',
        `Täytä kysely ${process.env.FRONTEND_URL}/auth/questionnaire/${Survey.surveyId}
        <br><br>
        ${Survey.message}`])
      }
      for (const User of removedRespondents) {
        await Group.removeUser(User, {transaction})
        const rows = await db.Answer.destroy({
          where: {
            SurveySurveyId: Survey.surveyId,
            UserUserId: User.userId
          },
          force: true,
          transaction
        })
        if (rows) {
          await Survey.decrement('responses', {transaction})
        }
      }
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
          model: db.User
        }
      }
    })
    if (Survey) return res.json(Survey)
    else return res.sendStatus(410)
  }
})