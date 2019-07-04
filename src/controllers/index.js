const express = require('express')
const router = express.Router()

const anonUser = require('./anonuser')

router.get('/anonusers', anonUser.getAnonUsers)

module.exports = router