const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/authController');
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post('/login', login);
router.patch('/changepassword', authMiddleware, changePassword);


module.exports = router;