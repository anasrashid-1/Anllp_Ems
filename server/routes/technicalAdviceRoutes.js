const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { getTechnicalAdvices, postTechnicalAdvice } = require("../controllers/technicalAdviceController");


router.post('/post', authMiddleware, postTechnicalAdvice);
router.get('/get', authMiddleware, getTechnicalAdvices);

module.exports = router;