const express = require('express')
const bodyParser = require('body-parser')

const sequelize = require('./models')
const config = require('./config')
const routes = require('./controllers')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
  })
})
