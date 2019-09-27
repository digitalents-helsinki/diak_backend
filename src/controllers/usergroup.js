const uuidv4 = require('uuid/v4')

module.exports = (app, db) => {
  app.get('/usergroup/:id', (req, res) => {
    db.models.UserGroup.findAll({
      where: {
        id: req.params.id
      }
    })
    .then((result) => res.json(result))
    .catch(err => console.log(err))
  })
  app.post("/usergroup/", (req, res) => {
    db.models.UserGroup.create({
      id: uuidv4()
    })
    res.json({status: 'ok'})
  })
}
