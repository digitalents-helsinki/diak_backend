const express = require('express')
const router = express.Router()

const { authenticateUser } = require('../jwt')
const getSurvey = require('../controllers/auth/getSurvey')
const getResult = require('../controllers/auth/getResult')
const createResult = require('../controllers/auth/createResult')
const saveResult = require('../controllers/auth/saveResult')
const emailResult = require('../controllers/auth/emailResult')
const getInfo = require('../controllers/auth/getInfo')
const updateInfo = require('../controllers/auth/updateInfo')

router.use(authenticateUser)

router.get('/survey/:id', getSurvey)
router.post('/result/create', createResult)
router.post('/result/save', saveResult)
router.post("/result/email", emailResult)
router.get('/result/:id', getResult)
router.get('/user/info', getInfo)
router.post('/user/info/update', updateInfo)

module.exports = router