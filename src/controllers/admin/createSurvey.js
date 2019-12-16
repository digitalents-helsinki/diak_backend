const wrapAsync = require('../common/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const sendMail = require('../../utils/mail')

module.exports = ({ final }) => wrapAsync(async (req, res, next) => {

  let transaction
  const sendMails = []

  try {
    transaction = await db.sequelize.transaction()

    await db.Survey.destroy({
      where: {
        surveyId: req.body.surveyId,
        ownerId: res.locals.decoded.sub,
        final: false
      },
      limit: 1,
      transaction
    })

    const Survey = await db.Survey.create({
      surveyId: req.body.surveyId || uuidv4(),
      ownerId: res.locals.decoded.sub,
      name: req.body.id,
      message: req.body.message,
      anon: req.body.anon,
      startDate: req.body.startDate ? new Date(req.body.startDate).setHours(0, 0, 0) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59) : null,
      respondents_size: req.body.to.length,
      final,
      Questions: req.body.questions.map(question => ({
        questionId: uuidv4(),
        name: question.name || uuidv4() + '_custom',
        number: question.number,
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

    for (const to of req.body.to) {
      if (Survey.anon) {
        const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
        const AnonUser = await db.AnonUser.create({
          id: uuidv4(),
          entry_hash: hash
        }, {transaction})
        await Group.addAnonUser(AnonUser, {transaction})
        if (final) {
          sendMails.push([to, 'Uusi kysely',
          `Täytä anonyymi kysely ${process.env.FRONTEND_URL}/anon/questionnaire/${Survey.surveyId}/${hash}
          <br><br>
          ${Survey.message}`])
        }
      } else {
        const [User] = await db.User.findOrCreate({
          where: {
            $col: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), db.sequelize.fn('lower', to))
          },
          defaults: {
            userId: uuidv4(),
            email: to
          },
          attributes: ['userId'],
          lock: true,
          transaction
        })
        await Group.addUser(User, {transaction})
        if (final) {
          sendMails.push([to, 'Uusi kysely',
          `Täytä kysely ${process.env.FRONTEND_URL}/auth/questionnaire/${Survey.surveyId}
          <br><br>
          ${Survey.message}`])
        }
      }
    }

    await transaction.commit()

  } catch(err) {
    await transaction.rollback()
    return next(err)
  }
  if (transaction.finished === 'commit') {
    if (final) sendMails.forEach(params => sendMail(...params))
    return res.send("Survey succesfully created")
  }
})