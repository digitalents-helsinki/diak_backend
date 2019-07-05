const uuidv4 = require('uuid/v4')

module.exports = (app, db) => {
  app.get('/users', (req, res) =>
    db.models.AnonUser.findAll().then((result) => res.json(result))
  )
  app.post("/user", (req, res) => {
    db.models.AnonUser.create({
      id: uuidv4(),
      entry_hash: 'test'
    })
    res.json({status: 'ok'})
  })
}