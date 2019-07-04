const express = require('express')
const bodyParser = require('body-parser')
const config = require('dotenv')
config.config()
const sequelize = require('./models')
const routes = require('./router')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

app.use('/api/', routes)

sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
  })
})
