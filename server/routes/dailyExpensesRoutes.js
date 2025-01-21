const express = require('express');
const {authMiddleware} = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/multer.middleware");
const router = express.Router();
const {postDailyExpenses, patchDailyExpenses, getDailyExpenses} = require("../controllers/dailyExpensesController");



router.post('/add', authMiddleware, uploadMiddleware.single("file"), postDailyExpenses);
router.patch('/update', authMiddleware, patchDailyExpenses);
router.get('/:userId?', authMiddleware, getDailyExpenses)


module.exports = router;