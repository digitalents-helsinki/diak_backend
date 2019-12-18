require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const csrf = require('csurf')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const db = require('./models')

const app = express()

app.use(helmet())

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  allowedHeaders: ['Content-type', 'Authorization', 'CSRF-Token'],
  credentials: true
}
app.use(cors(corsOptions))

app.use(cookieParser())

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
})
app.use(csrfProtection)

app.use(bodyParser.json())

db.sequelize.sync({ force: false })
.then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
  })
  return true
})

app.use('/supervisor', require('./router/supervisor'))
app.use('/admin', require('./router/admin'))
app.use('/auth', require('./router/auth'))
app.use('/anon', require('./router/anon'))
app.use(require('./router/common'))

app.use(require('./controllers/error/error'))