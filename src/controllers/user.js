'use strict'

const uuidv4 = require('uuid/v4')
const { UserService } = require('../services/user').default

module.exports = (app, db) => {
  app.post("/user/create", async (req, res, next) => {
    /*
    db.models.User.create({
      userId: uuidv4(),
      email: req.body.email,
      name: req.body.name,
      gender: req.body.gender
    })
    */
    const userDTO = req.body
    const { user } = await UserService.SignUp(userDTO)
    return res.json({user})
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