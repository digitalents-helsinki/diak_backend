const express = require('express')
const bodyParser = require('body-parser')
const config = require('dotenv')
config.config()
const db = require('./models')
const apiUser = require('./controllers/anonuser')
const apiResult = require('./controllers/result')
// const routes = require('./router')


const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

//app.use('/api/', routes)

apiUser(app, db)
apiResult(app, db)

db.sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
  })
})
