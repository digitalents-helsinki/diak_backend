const express = require('express')
const router = express.Router()
const morgan = require('morgan')

const logIn = require('../controllers/supervisor/logIn')
const authorize = require('../controllers/supervisor/authorize')
const getAdmins = require('../controllers/supervisor/getAdmins')
const createAdmin = require('../controllers/supervisor/createAdmin')
const deleteAdmin = require('../controllers/supervisor/deleteAdmin')

router.use(morgan('combined'))

router.post('/login', logIn)

router.use(authorize)

router.get('/admin/all', getAdmins)
router.post("/admin/create", createAdmin)
router.post("/admin/delete", deleteAdmin)


module.exports = router