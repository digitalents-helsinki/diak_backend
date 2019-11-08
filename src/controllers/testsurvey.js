// const express = require('express')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const wrapAsync = require('../wrapAsync')
// const router = express.Router()

module.exports = (app, db) => {
  app.post('/testsurvey/', wrapAsync(async (req, res) => {
    const [Survey] = await db.Survey.findOrCreate({
      where: {
        name: "testikysely"
      },
      defaults: {
        surveyId: uuidv4(),
        name: "testikysely",
        message: 'Tervetuloa vastaamaan testikyselyyn',
        anon: true,
        archived: false,
        active: true,
        Questions: [{name:"health",number:1},{name:"overcoming",number:2},{name:"living",number:3},{name:"coping",number:4},{name:"family",number:5},{name:"friends",number:6},{name:"finance",number:7},{name:"strengths",number:8},{name:"self_esteem",number:9},{name:"life_as_whole",number:10}].map(question => {
          return {
            questionId: uuidv4(),
            name: question.name,
            number: question.number
          }
        })
      },
      include: [ db.Question ]
    })

    const [Group] = await db.UserGroup.findOrCreate({
      where: {
        SurveySurveyId: Survey.surveyId
      },
      defaults: {
        id: uuidv4(),
        respondents: []
      }
    })

    const AnonUser = await db.AnonUser.create({
      id: uuidv4(),
      entry_hash: crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
    })

    await Survey.increment('respondents_size')

    await Group.addAnonUser(AnonUser)

    res.json({
      surveyId: Survey.surveyId,
      anonId: AnonUser.entry_hash
    })

  }))
}