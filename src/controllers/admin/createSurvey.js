const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const { MassEmail, generateAnonSurveyEmail, generateAuthSurveyEmail } = require('../../utils/sendMail')
const asyncRecurser = require('../../utils/asyncRecurser')

module.exports = ({ final }) => wrapAsync(async (req, res, next) => {

  let transaction
  const mails = new MassEmail()

  try {
    transaction = await db.sequelize.transaction()

    await db.Survey.destroy({
      where: {
        surveyId: req.body.surveyId,
        ownerId: res.locals.decoded.sub,
        final: false
      },
      transaction
    })

    const startDate = req.body.startDate ? new Date(req.body.startDate).setHours(0, 0, 0, 0) : null
    const endDate = req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59, 999) : null

    const Survey = await db.Survey.create({
      surveyId: req.body.surveyId || uuidv4(),
      ownerId: res.locals.decoded.sub,
      name: req.body.id,
      message: req.body.message,
      anon: req.body.anon,
      startDate,
      endDate,
      respondents_size: req.body.to.length,
      final,
      emailsSent: (!startDate || startDate === (d => d.setHours(0, 0, 0, 0))(new Date()) && final),
      Questions: req.body.questions.map((question, idx) => ({
        questionId: uuidv4(),
        name: question.name || uuidv4() + '_custom',
        number: idx + 1,
        title: question.title,
        description: question.description,
        help: question.help
      }))
    },
    { 
      include: [db.Question],
      transaction
    })

    const Group = await db.UserGroup.create({
      id: uuidv4(),
      respondents: Survey.anon ? req.body.to : []
    }, {transaction})

    await Group.setSurvey(Survey, {transaction})

    await asyncRecurser(req.body.to, async (email, promises) => {
      if (Survey.anon && final && Survey.emailsSent) {
        const entry_hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
        const id = uuidv4()
        promises.push(db.AnonUser.create({ id, entry_hash }, {transaction}), Group.addAnonUser(id, {transaction}))
        mails.add(generateAnonSurveyEmail(email, Survey.surveyId, Survey.message, entry_hash))
      } else if (!Survey.anon) {
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
        if (final && Survey.emailsSent) {
          mails.add(generateAuthSurveyEmail(email, Survey.surveyId, Survey.message))
        }
      }
    })

    if (final) await mails.send()
    
    await transaction.commit()

  } catch(err) {
    await transaction.rollback()
    return next(err)
  }
  if (transaction.finished === 'commit') {
    return res.send("Survey succesfully created")
  }
})