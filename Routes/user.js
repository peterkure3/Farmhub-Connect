const express = require('express');
const userController = require('../Controllers/userController');

const router = express.Router();

router.post('/users', userController.addUser);
router.post('/login', userController.loginUser);
router.post('/users/forgot-password', userController.forgotPassword);
router.post('/users/update-password', userController.updatePassword);

module.exports = router;