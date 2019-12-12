const db = require('../../models')

module.exports = (req, res, next) => {
  return db.Survey.findOne({
    where: {
      surveyId: req.params.id,
      ownerId: res.locals.decoded.sub
    },
    rejectOnEmpty: true,
    include: [{
      model: db.Question,
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      include: [{
        model: db.Answer,
        where: {
          final: true
        },
        required: false,
        attributes: {
          exclude: ['createdAt']
        },
        include: [{
          model: db.User,
          attributes: ['userId', 'post_number', 'name', 'age', 'gender']
        }, 
        {
          model: db.AnonUser,
          attributes: ['id', 'age', 'gender']
        }]
      }]
    }]
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(result => res.json(result)).catch(next)
}