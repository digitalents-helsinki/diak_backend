const express = require('express')
const router = express.Router()

const anonUser = require('./controllers/anonuser')

router.get('/anonusers', anonUser.getAnonUsers)

module.exports = router