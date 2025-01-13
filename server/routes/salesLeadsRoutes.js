const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { postSalesLead, putSalesLead, getSalesLead } = require("../controllers/salesLeadController");



router.post('/add', authMiddleware, postSalesLead);
router.put('/update/:wid', authMiddleware, putSalesLead);
router.get('/get', authMiddleware, getSalesLead);


module.exports = router;