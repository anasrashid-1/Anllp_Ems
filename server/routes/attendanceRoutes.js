const express = require('express');
const router = express.Router();
const {authMiddleware} = require("../middlewares/authMiddleware");
const {getAttendanceStatus, getAttendanceLogs, postCheckInUser, patchCheckOut, postAttendanceLogs, getUserAttendance} = require("../controllers/attendanceController");

router.get('/status/:userId?', authMiddleware, getAttendanceStatus);
router.post('/locationlog', authMiddleware, postAttendanceLogs);
router.get('/logs/:attendanceId?', authMiddleware, getAttendanceLogs);
router.post('/checkin', authMiddleware, postCheckInUser);
router.patch('/checkout', authMiddleware, patchCheckOut);
// Route to fetch user's attendance
router.get('/user', authMiddleware, getUserAttendance)



module.exports = router;