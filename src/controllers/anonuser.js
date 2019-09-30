const uuidv4 = require('uuid/v4')
const crypto = require('crypto')

module.exports = (app, db) => {
  app.get('/anonuser/all/:usergroupid', (req, res) =>
    db.AnonUser.findAll().then((result) => res.json(result))
  )
  app.post("/anonuser/create", (req, res) => {
    const hash = crypto.createHash('md5').update("" + (Math.random() * 99999999) + Date.now()).digest("hex")
    db.AnonUser.create({
      id: uuidv4(),
      entry_hash: hash
    })
    res.json({status: 'ok', hash: hash})
  })
}