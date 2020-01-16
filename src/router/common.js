const express = require('express')
const router = express.Router()

const getCsrfToken = require('../controllers/common/getCsrfToken')
const validatePassword = require('../controllers/common/validatePassword')
const signUp = require('../controllers/common/signUp')
const signIn = require('../controllers/common/signIn')
const signInWithGoogle = require('../controllers/common/signInWithGoogle')
const recoveryEmail = require('../controllers/common/recoveryEmail')
const changePassword = require('../controllers/common/changePassword')
const createPassword = require('../controllers/common/createPassword')

router.get('/surf', getCsrfToken)

router.post('/signup', validatePassword, signUp)
router.post('/signin', validatePassword, signIn)
router.post('/signin/google', signInWithGoogle)

router.post('/recover', recoveryEmail)
router.post('/changepassword', validatePassword, changePassword)
router.post('/createpassword', validatePassword, createPassword)

module.exports = router