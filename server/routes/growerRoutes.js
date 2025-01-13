const express = require('express');
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {getGrowerDetails} = require("../controllers/growerController");

router.get('/get', authMiddleware, getGrowerDetails);

module.exports = router;