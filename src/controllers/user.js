module.exports = (app, db) => {
  app.get('/user/:id', (req, res) => {
    db.User.findOne({
      where: {
        userId: req.params.id
      }
    }).then((result => res.json(result)))
  })
}