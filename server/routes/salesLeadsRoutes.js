const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { postSalesLead, putSalesLead, getSalesLead, postSalesLeadFollowUp, getSalesLeadFollowUps } = require("../controllers/salesLeadController");



router.post('/add', authMiddleware, postSalesLead);
router.put('/update/:wid', authMiddleware, putSalesLead);
router.get('/get', authMiddleware, getSalesLead);
router.post('/followup/post', authMiddleware, postSalesLeadFollowUp);
router.get('/followup/get', authMiddleware, getSalesLeadFollowUps);

module.exports = router;