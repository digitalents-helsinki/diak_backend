const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const sendMail = require('../../utils/mail')

module.exports = wrapAsync(async (req, res, next) => {

  let transaction
  const sendMails = []

  try {
    transaction = await db.sequelize.transaction()

    const SurveyToBeFollowedUp = await db.Survey.findOne({
      where: {
        surveyId: req.params.surveyId,
        ownerId: res.locals.decoded.sub,
        endDate: {
          [db.Sequelize.Op.lt]: new Date(),
          [db.Sequelize.Op.ne]: null
        }
      },
      lock: true,
      transaction
    })

    const Questions = await db.Question.findAll({
      where: {
        SurveySurveyId: SurveyToBeFollowedUp.surveyId
      },
      lock: true,
      transaction
    })

    const surveyGroupId = SurveyToBeFollowedUp.surveyGroupId || uuidv4()

    if (!SurveyToBeFollowedUp.surveyGroupId) {
      await SurveyToBeFollowedUp.update({
        surveyGroupId
      }, {transaction})
    }

    const FollowUpSurvey = await db.Survey.create({
      surveyId: uuidv4(),
      ownerId: res.locals.decoded.sub,
      surveyGroupId,
      name: req.body.name,
      message: req.body.message,
      anon: SurveyToBeFollowedUp.anon,
      startDate: req.body.startDate ? new Date(req.body.startDate).setHours(0, 0, 0) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate).setHours(23, 59, 59) : null,
      respondents_size: req.body.to.length,
      Questions: Questions.map(question => ({
        questionId: uuidv4(),
        name: question.name,
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
      respondents: FollowUpSurvey.anon ? req.body.to : [],
      SurveySurveyId: FollowUpSurvey.surveyId
    }, {transaction})

    for (const to of req.body.to) {
      if (FollowUpSurvey.anon) {
        const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
        const AnonUser = await db.AnonUser.create({
          id: uuidv4(),
          entry_hash: hash
        }, {transaction})
        await Group.addAnonUser(AnonUser, {transaction})
        sendMails.push([to, 'Uusi kysely',
        `Täytä anonyymi kysely ${process.env.FRONTEND_URL}/anon/questionnaire/${FollowUpSurvey.surveyId}/${hash}
        <br><br>
        ${FollowUpSurvey.message || ''}`])
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
        sendMails.push([to, 'Uusi kysely',
        `Täytä kysely ${process.env.FRONTEND_URL}/auth/questionnaire/${FollowUpSurvey.surveyId}
        <br><br>
        ${FollowUpSurvey.message || ''}`])
      }
    }

    await transaction.commit()

  } catch(err) {
    await transaction.rollback()
    return next(err)
  }
  if (transaction.finished === 'commit') {
    sendMails.forEach(params => sendMail(...params))
    return res.send("Survey succesfully created")
  }
})