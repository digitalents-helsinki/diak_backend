const express = require('express')
const router = express.Router()

const getSurvey = require('../controllers/anon/getSurvey')
const createResult = require('../controllers/anon/createResult')
const saveResult = require('../controllers/anon/saveResult')
const emailResult = require('../controllers/anon/emailResult')
const getResult = require('../controllers/anon/getResult')
const updateInfo = require('../controllers/anon/updateInfo')

router.get('/survey/:id/:entry_hash', getSurvey)
router.post("/result/create", createResult)
router.post('/result/save/', saveResult)
router.post("/result/email", emailResult)
router.get('/result/:id/:entry_hash', getResult)
router.post('/user/:entry_hash/info/update', updateInfo)

module.exports = router