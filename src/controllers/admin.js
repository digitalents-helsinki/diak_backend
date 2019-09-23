const uuidv4 = require('uuid/v4')

module.exports = (app, db) => {
  app.get('/admin/:id', (req, res) => {
    db.models.Admin.findAll({
      where: {
        id: req.params.id
      }
    }).then((result) => res.json(result))
  })
  app.post("/admin/create", (req, res) => {
    db.Admin.create({
      adminId: uuidv4()
    })
    res.json({status: 'ok'})
  })
}