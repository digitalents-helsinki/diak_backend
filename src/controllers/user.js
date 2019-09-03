const uuidv4 = require('uuid/v4')

module.exports = (app, db) => {
  app.post("/user/create", (req, res) => {
    let uid = uuidv4()
    db.models.User.create({
      id: uid,
      email: req.body.email,
      name: req.body.name,
      gender: req.body.gender
    })
    res.json({status: 'ok', id: uid})
  })
  app.get("/user/:id", (req, res) => {
    db.models.User.findAll({
      where: {
        id: req.params.id
      }
    }).then((result) => res.json(result))
  })
}