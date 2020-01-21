const cron = require('node-cron')
const db = require('../models')
const asyncRecurse = require('./asyncRecurser')
const { MassEmail, generateAuthSurveyEmail, generateAnonSurveyEmail } = require('./sendMail')
const crypto = require('crypto')
const uuidv4 = require('uuid/v4')

const dailySurveys = async () => {
  let transaction
  const mails = new MassEmail()

  try {
    transaction = await db.sequelize.transaction()

    const todayImminent = (d => d.setHours(0, 0, 0, 0))(new Date)
    const weekBefore = (d => d.setDate(d.getDate() - 7))(new Date(todayImminent))
  
    const StartingSurveys = await db.Survey.findAll({
      where: {
        startDate: {
          [db.Sequelize.Op.lte]: todayImminent,
          [db.Sequelize.Op.gte]: weekBefore
        },
        createdAt: {
          [db.Sequelize.Op.lt]: todayImminent
        },
        emailsSent: false,
        final: true
      },
      lock: true,
      transaction
    })
  
    await asyncRecurse(StartingSurveys, async (Survey, promises) => {
      const Group = await db.UserGroup.findOne({
        where: {
          SurveySurveyId: Survey.surveyId
        },
        lock: true,
        transaction
      })

      promises.push(Survey.update({ emailsSent: true }, { transaction }))

      if (Survey.anon) {
        await asyncRecurse(Group.respondents, (email, promises) => {
          const entry_hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
          const id = uuidv4()
          promises.push(db.AnonUser.create({ id, entry_hash }, {transaction}), Group.addAnonUser(id, {transaction}))
          mails.add(generateAnonSurveyEmail(email, Survey.surveyId, Survey.message, entry_hash))
        })
      } else {
        const emails = await Group.getUsers({
          attributes: ['email'],
          lock: true,
          transaction
        }).map(user => user.email)
        emails.forEach(email => mails.add(generateAuthSurveyEmail(email, Survey.surveyId, Survey.message)))
      }
    })

    await transaction.commit()

  } catch(err) {
    await transaction.rollback()
    console.error(`Sending daily mails failed: ${err}`)
  }
  if (transaction.finished === 'commit') {
    mails.send()
    console.log(`Sent ${mails.getAmount()} daily mails.`)
  }
}

module.exports = () => cron.schedule('0 5 * * *', dailySurveys)