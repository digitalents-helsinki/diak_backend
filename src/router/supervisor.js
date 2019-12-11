const express = require('express')
const router = express.Router()

const authorize = require('../controllers/supervisor/authorize')
const getAdmins = require('../controllers/supervisor/getAdmins')
const createAdmin = require('../controllers/supervisor/createAdmin')
const deleteAdmin = require('../controllers/supervisor/deleteAdmin')

router.post('/authorize', authorize)

router.get('/admin/all', getAdmins)
router.post("/admin/create", createAdmin)
router.post("/admin/delete", deleteAdmin)


module.exports = router