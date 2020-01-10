const wrapAsync = require('../../utils/wrapAsync')
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

    const formUsers = () => new Promise(resolve => 
      (async function asyncRecurseOverUserEmails(i = 0, promises = []) {
        const email = req.body.to[Number(i)]
        if (email) {
          if (Survey.anon) {
            const entry_hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
            const id = uuidv4()
            promises.push(db.AnonUser.create({ id, entry_hash }, {transaction}), Group.addAnonUser(id, {transaction}))
            if (final) {
              sendMails.push([email, 'Uusi kysely',
              `Täytä anonyymi kysely ${process.env.FRONTEND_URL}/anon/questionnaire/${Survey.surveyId}/${entry_hash}
              <br><br>
              ${Survey.message || ''}`])
            }
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
            if (final) {
              sendMails.push([email, 'Uusi kysely',
              `Täytä kysely ${process.env.FRONTEND_URL}/auth/questionnaire/${Survey.surveyId}
              <br><br>
              ${Survey.message || ''}`])
            }
          }
          setImmediate(asyncRecurseOverUserEmails, i + 1, promises)
        } else {
          resolve(Promise.all(promises))
        }
      })()
    )

    await formUsers()

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