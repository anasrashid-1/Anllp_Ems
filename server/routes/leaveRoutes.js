const express = require('express');
const {authMiddleware} = require("../middlewares/authMiddleware");
const router = express.Router();


const {getLeaves, patchLeaves, postLeaves} = require("../controllers/leaveController")

router.get('/get/:userId?', authMiddleware, getLeaves);
router.patch('/update/:action?/:leaveId?', authMiddleware, patchLeaves);
router.post('/add', authMiddleware, postLeaves);

module.exports = router;