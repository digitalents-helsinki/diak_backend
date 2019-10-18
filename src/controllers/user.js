module.exports = (app, db) => {
  app.get('/user/:id', (req, res) => {
    db.User.findOne({
      where: {
        userId: req.params.id
      }
    }).then((result => res.json(result)))
  }),
  app.post('/user/:userId/info/update', (req, res) => {
    db.User.update(
      {
        name: req.body.personalinfo.name,
        address: req.body.personalinfo.address,
        gender:req.body.personalinfo.gender,
        phone_number: req.body.personalinfo.phonenumber
      },
      {
        where: {
          userId: req.params.userId
        }
      }
    )
  })
}