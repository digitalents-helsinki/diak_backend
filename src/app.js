const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('dotenv')
config.config()

const db = require('./models')
const apiAnonUser = require('./controllers/anonuser')
const apiResult = require('./controllers/result')
const apiSurvey = require('./controllers/survey')
const apiAdmin = require('./controllers/admin')
const apiAuth = require('./controllers/auth')
const apiUser = require('./controllers/user')
const apiTestSurvey = require('./controllers/testsurvey')
const errorHandler = require('./controllers/error')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

db.sequelize.sync({ force: false })
.then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
  })
  return true
})

apiAnonUser(app, db)
apiUser(app, db)
apiResult(app, db)
apiSurvey(app, db)
apiAdmin(app, db)
apiAuth(app, db)
apiUser(app, db)
apiTestSurvey(app, db)
errorHandler(app)