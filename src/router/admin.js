const express = require('express')
const router = express.Router()
const morgan = require('morgan')

morgan.token('sub', (req, res) => res.locals.decoded.sub)

const authenticate = require('../controllers/common/authenticate')
const authorizeAdmin = require('../controllers/admin/authorizeAdmin')
const createSurvey = require('../controllers/admin/createSurvey')
const getSurveys = require('../controllers/admin/getSurveys')
const getSurveyById = require('../controllers/admin/getSurveyById')
const updateSurvey = require('../controllers/admin/updateSurvey')
const deleteSurvey = require('../controllers/admin/deleteSurvey')
const archiveSurvey = require('../controllers/admin/archiveSurvey')
const getResultById = require('../controllers/admin/getResultById')

router.use(authenticate)
router.use(authorizeAdmin)
router.use(morgan(':url :sub :remote-addr'))

router.post('/survey/create', createSurvey({ final: true }))
router.put('/survey/save', createSurvey({ final: false }))
router.get('/survey/all', getSurveys)
router.get('/survey/:surveyId', getSurveyById)
router.patch('/survey/:surveyId/update', updateSurvey)
router.delete('/survey/:surveyId/delete', deleteSurvey)
router.patch('/survey/:surveyId/archive', archiveSurvey)
router.get('/results/:id', getResultById)

module.exports = router