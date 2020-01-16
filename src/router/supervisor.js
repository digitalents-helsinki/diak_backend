const express = require('express')
const router = express.Router()
const morgan = require('morgan')

const logIn = require('../controllers/supervisor/logIn')
const authorize = require('../controllers/supervisor/authorize')
const getAdmins = require('../controllers/supervisor/getAdmins')
const createAdmin = require('../controllers/supervisor/createAdmin')
const revokeAdmin = require('../controllers/supervisor/revokeAdmin')
const searchUser = require('../controllers/supervisor/searchUser')
const deleteUser = require('../controllers/supervisor/deleteUser')
const deleteByEmail = require('../controllers/supervisor/deleteByEmail')

router.use(morgan('combined'))

router.post('/login', logIn)

router.use(authorize)

router.get('/admin/all', getAdmins)
router.post("/admin/create", createAdmin)
router.post("/admin/delete", revokeAdmin)
router.get('/user/search/:searchTerm', searchUser)
router.delete('/user/:userId/delete', deleteUser)
router.post('/deletebyemail', deleteByEmail)

module.exports = router