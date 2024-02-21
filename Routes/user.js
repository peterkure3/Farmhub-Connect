const express = require('express');
const userController = require('../Controllers/userController');

const router = express.Router();

router.post('/register', userController.addUser);
router.post('/login', userController.loginUser);
router.post('/users/forgot-password', userController.forgotPassword);
router.post('/users/update-password', userController.updatePassword);
router.get('/getusers', userController.getAllUsers);

module.exports = router;