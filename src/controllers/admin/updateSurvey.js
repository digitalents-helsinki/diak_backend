const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const { MassEmail, AnonSurveyEmail, AuthSurveyEmail } = require('../../utils/sendMail')
const asyncRecurser = require('../../utils/asyncRecurser')

module.exports = wrapAsync(async (req, res, next) => {
    
  let transaction
  const mails = new MassEmail()
  
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
      endDate: req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59, 999) : null,
      respondents_size: Survey.anon ? anonEmails.length + Survey.respondents_size : emails.length,
      active: req.body.active
    }, {transaction})

    const todayImminent = (d => new Date(d.setHours(0, 0, 0, 0)))(new Date())
    
    if (Survey.anon && (!Survey.startDate || Survey.startDate.getTime() === todayImminent.getTime())) {
      await asyncRecurser(anonEmails, (email, promises) => {
        const entry_hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
        const id = uuidv4()
        promises.push(db.AnonUser.create({ id, entry_hash }, {transaction}), Group.addAnonUser(id, {transaction}))
        mails.add(new AnonSurveyEmail(email, Survey.surveyId, Survey.message, entry_hash))
      })
      await Group.update({
        respondents: [...Group.respondents, ...anonEmails]
      }, {transaction})

    } else if (!Survey.anon) {
      
      const Users = await Group.getUsers({
        attributes: ['userId', 'email'],
        lock: true,
        transaction
      })
      const comparisonUserEmails = Users.map(user => user.email.toLowerCase())
      const addedRespondents = emails.filter(email => !comparisonUserEmails.some(userEmail => userEmail === email))
      const comparisonEmails = emails.map(email => email.toLowerCase())
      const removedRespondents = Users.filter(user => !comparisonEmails.includes(user.email.toLowerCase()))

      await asyncRecurser(addedRespondents, async (email, promises) => {
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
        if (!Survey.startDate || Survey.startDate.getTime() === todayImminent.getTime()) mails.add(new AuthSurveyEmail(email, Survey.surveyId, Survey.message))
      })

      await asyncRecurser(removedRespondents, async (User, promises) => {
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
      })

    }
    
    await transaction.commit()
    
  } catch(err) {
    await transaction.rollback()
    return next(err)
  }
  if (transaction.finished === 'commit') {
    mails.send()
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