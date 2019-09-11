import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import routes from './controllers'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.use(cors())
app.use(routes())

app.listen(process.env.PORT, () => {
  console.log(`app listening on port ${process.env.PORT}`)
})

