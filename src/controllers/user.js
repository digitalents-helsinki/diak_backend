'use strict'

const uuidv4 = require('uuid/v4')

module.exports = (app, db) => {
  app.post("/user/create", (req, res) => {
    db.models.User.create({
      userId: uuidv4(),
      email: req.body.email,
      name: req.body.name,
      gender: req.body.gender
    })
    res.json({status: 'ok'})
  })
  app.get("/user/:id", (req, res) => {
    db.models.User.findAll({
      where: {
        userId: req.params.id
      }
    }).then((result) => res.json(result))
  })
  app.get("/user/:id/results", (req, res) => {
    db.models.User.findAll({
      where: {
        userId: req.params.id
      }
    }).then(result => res.json(result.getSurveyResults))
  })
}