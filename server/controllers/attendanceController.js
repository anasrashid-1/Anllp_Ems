const connection = require("../config/connect.mssql");
const moment = require('moment');

const getAttendanceStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, date } = req.query;
        let query;
        let replacements;
        if (userId && status && date) {
            console.log(userId, status, date);
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from appUsers u
                     inner join Attendance a on u.userId = a.userId and a.attendanceDate = CAST(? AS DATE)
                     and a.status = ? where a.userId = ?`
            replacements = [date, status, userId];
        } else if (!userId && status && date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from appUsers u inner join Attendance a on u.userId = a.userId 
                     and a.attendanceDate = CAST(? AS DATE) and a.status = ?`
            replacements = [date, status];
        } else if (!userId && !status && date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from appUsers u left join Attendance a on u.userId = a.userId 
                     and a.attendanceDate = CAST(? AS DATE)`
            replacements = [date];
        } else if (!userId && status && !date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from appUsers u inner join Attendance a on u.userId = a.userId 
                     and a.status = ?`
            replacements = [status];
        } else if (!userId && !status && !date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from appUsers u left join Attendance a on u.userId = a.userId 
                     and a.attendanceDate = CAST(GETDATE() AS DATE)`
            replacements = [];
        } else if (userId && !status && !date) {
            query = `select * from Attendance where userId = ? and attendanceDate = CAST(GETDATE() AS DATE)`;
            replacements = [userId];
        } else {
            return res.status(400).json({ message: "Invalid fields!" });
        }

        const data = await connection.query(query, {
            replacements,
            type: connection.QueryTypes.SELECT,
        });

        let deviceDetails = [];
        if (userId) {
            const query2 = "select deviceID, deviceName from appUsers where userId = ?";
            deviceDetails = await connection.query(query2, {
                replacements: [userId],
                type: connection.QueryTypes.SELECT,
            });
        }

        res.status(200).json({
            isError: false,
            message: "attendance status fetched successfully",
            data,
            deviceDetails
        });

    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
}

const postAttendanceLogs = async (req, res) => {
    try {
        console.log(req.body)
        const userId = req.userId;
        const { attendanceId, lat, long } = req.body;
        if (!userId || !attendanceId || !lat || !long) {
            return res.status(400).json({ message: "All parameters are required" });
        }
        // Check if there's an active check-in for today
        const existingCheckIn = await connection.query(
            `SELECT * FROM Attendance WHERE userId = ? AND attendanceDate = CAST(GETDATE() AS DATE) AND checkOutTime IS NULL AND attendanceId = ?`,
            {
                replacements: [userId, attendanceId],
                type: connection.QueryTypes.SELECT,
            }
        );

        if (existingCheckIn.length === 0) {
            return res.status(400).json({ message: "No active check-in found for today" });
        }

        // Insert new check-in record
        const query = `insert into locationLogs (attendanceId, latitude, longitude, loggedAt)
                       values (? , ? , ? , GETDATE())`;
        await connection.query(query, {
            replacements: [attendanceId, lat, long],
            type: connection.QueryTypes.INSERT,
        });

        res.status(201).json({
            isError: false,
            message: "location log updated successful",
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
}

const getAttendanceLogs = async (req, res) => {
    try {
        const attendanceId = req.params.attendanceId;
        if (!attendanceId) {
            return res.status(400).json({ message: "Param is required" });
        }
        const query = `SELECT a.userID, u.username, l.*
                        FROM Attendance a
                        INNER JOIN locationLogs l ON a.attendanceId = l.attendanceId
                        INNER JOIN appUsers u ON a.userId = u.userId 
                        where
                        l.attendanceId = ?`;
        const data = await connection.query(query, {
            replacements: [attendanceId],
            type: connection.QueryTypes.SELECT,
        });

        res.status(200).json({
            isError: false,
            message: "attendance logs fetched successfully",
            data,
        });

    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
}

const postCheckInUser = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID not found" });
        }

        // Check if the user already checked in today
        const existingCheckIn = await connection.query(
            `SELECT * FROM Attendance WHERE userId = ? AND attendanceDate = CAST(GETDATE() AS DATE)`,
            {
                replacements: [userId],
                type: connection.QueryTypes.SELECT,
            }
        );

        if (existingCheckIn.length > 0) {
            return res.status(400).json({ message: "User already checked in today" });
        }

        // Insert new check-in record
        const query = `INSERT INTO Attendance (userId, checkInTime, attendanceDate) VALUES (?, GETDATE(), CAST(GETDATE() AS DATE))`;
        await connection.query(query, {
            replacements: [userId],
            type: connection.QueryTypes.INSERT,
        });

        res.status(201).json({
            isError: false,
            message: "Check-in successful",
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
}

const patchCheckOut = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({ message: "User ID not found" });
        }

        // Check if there's an active check-in for today
        const existingCheckIn = await connection.query(
            `SELECT * FROM Attendance WHERE userId = ? AND attendanceDate = CAST(GETDATE() AS DATE) AND checkOutTime IS NULL`,
            {
                replacements: [userId],
                type: connection.QueryTypes.SELECT,
            }
        );

        if (existingCheckIn.length === 0) {
            return res.status(400).json({ message: "No active check-in found for today" });
        }

        // Update the check-out time
        const query = `UPDATE Attendance SET checkOutTime = GETDATE() WHERE userId = ? AND attendanceDate = CAST(GETDATE() AS DATE) AND checkOutTime IS NULL`;
        await connection.query(query, {
            replacements: [userId],
            type: connection.QueryTypes.UPDATE,
        });

        res.status(200).json({
            isError: false,
            message: "Check-out successful",
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
}


const getUserAttendance = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({ message: "User ID not found" });
        }

        const query = `
            SELECT attendanceId, CAST(checkInTime as TIME) as checkInTime, CAST(checkOutTime as TIME) as checkOutTime, status, sessionDuration, attendanceDate
            FROM Attendance 
            WHERE userId = ?;
        `;
        const replacements = [userId];
        const data = await connection.query(query, {
            replacements,
            type: connection.QueryTypes.SELECT,
        });


        const formattedData = data.map(record => ({
            ...record,
            checkInTime: moment(record.checkInTime).format('HH:mm:ss'),
            checkOutTime: record.checkOutTime ? moment(record.checkOutTime).format('HH:mm:ss') : null,
        }));

        res.status(200).json({
            isError: false,
            message: "Attendance fetched successfully",
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
}


module.exports = { getAttendanceStatus, postAttendanceLogs, getAttendanceLogs, postCheckInUser, patchCheckOut, getUserAttendance };

