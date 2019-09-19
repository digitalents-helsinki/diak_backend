const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('dotenv')
config.config()

const db = require('./models')
const apiUser = require('./controllers/anonuser')
const apiResult = require('./controllers/result')
const apiLogin = require('./controllers/login')
const apiMail = require('./controllers/mail')
const apiSurvey = require('./controllers/survey')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.use(cors())

apiUser(app, db)
apiResult(app, db)
apiLogin(app)
apiMail(app)
apiSurvey(app, db)

db.sequelize.sync({
  force: true
}).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
  })
})
