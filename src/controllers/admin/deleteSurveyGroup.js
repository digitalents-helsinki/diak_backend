const db = require('../../models')

module.exports = (req, res, next) => {
  return db.Survey.destroy({
    where: {
      surveyGroupId: {
        [db.Sequelize.Op.eq]: req.params.surveyGroupId,
        [db.Sequelize.Op.ne]: null
      },
      ownerId: res.locals.decoded.sub
    }
  // eslint-disable-next-line promise/no-callback-in-promise
  }).then(rows => rows ? res.sendStatus(204) : res.sendStatus(404)).catch(next)
}