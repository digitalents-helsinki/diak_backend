import { createConnection } from 'typeorm'

createConnection({
  type: 'postgres',
  host: 'localhost',
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB
})
  .then(conn => {
    console.log('conn established')
  })
  .catch(err => {
    console.log('err', err)
  })
