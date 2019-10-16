module.exports = (app, db) => {
  app.get('/user/:id', (req, res) => {
    db.User.findOne({
      where: {
        userId: req.params.id
      }
    }).then((result => res.json(result)))
  }),
  app.post('/user/:id/info/update', (req, res) => {
    db.User.update({
      where: {
        userId: req.params.id
      }
    })
  })
}