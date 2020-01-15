const wrapAsync = require('../../utils/wrapAsync')
const db = require('../../models')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const { sendMail, MassEmail, AnonSurveyEmail, AuthSurveyEmail } = require('../../utils/sendMail')
const asyncRecurser = require('../../utils/asyncRecurser')
const { StatusError } = require('../../utils/customErrors')

module.exports = wrapAsync(async (req, res, next) => {

  let transaction
  const emails = new MassEmail()

  try {
    transaction = await db.sequelize.transaction()

    const SurveyToBeFollowedUp = await db.Survey.findOne({
      where: {
        surveyId: req.params.surveyId,
        ownerId: res.locals.decoded.sub,
        endDate: {
          [db.Sequelize.Op.lt]: new Date(),
          [db.Sequelize.Op.ne]: null
        },
        archived: false
      },
      lock: true,
      transaction
    })

    const surveyGroupId = SurveyToBeFollowedUp.surveyGroupId || uuidv4()

    const followUpSurveyAlreadyExists = await db.Survey.findOne({
      where: {
        surveyGroupId,
        endDate: {
          [db.Sequelize.Op.gt]: new Date(),
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

    if (followUpSurveyAlreadyExists) {
      throw new StatusError("There can't be multiple followup surveys at the same time", 422)
    }

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

    await asyncRecurser(req.body.to, async (email, promises) => {
      if (FollowUpSurvey.anon) {
        const entry_hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
        const id = uuidv4()
        promises.push(db.AnonUser.create({ id, entry_hash }, {transaction}), Group.addAnonUser(id, {transaction}))
        emails.add(new AnonSurveyEmail(email, FollowUpSurvey.surveyId, FollowUpSurvey.message, entry_hash))
      } else {
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
        emails.add(new AuthSurveyEmail(email, FollowUpSurvey.surveyId, FollowUpSurvey.message))
      }
    })

    await transaction.commit()

  } catch(err) {
    await transaction.rollback()
    return next(err)
  }
  if (transaction.finished === 'commit') {
    emails.send()
    return res.send("Survey succesfully created")
  }
})