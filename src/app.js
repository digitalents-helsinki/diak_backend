import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import routes from './controllers'
import { createConnection } from 'typeorm'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(routes())

createConnection({
  type: 'postgres',
  host: 'localhost',
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB,
  synchronize: true
}).then(connection => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
  })
})
