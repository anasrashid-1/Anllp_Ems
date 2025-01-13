const express = require("express");
const connection = require("./config/connect.mssql");
const moment = require('moment');
const path = require("path");
const fs = require("fs");

const http = require('http');
const socketio = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/growerLayouts', express.static(path.join(__dirname, 'growerLayouts')));

const jwt = require("jsonwebtoken");
const cors = require("cors");
app.use(cors());


const uploadMiddleware = require("./middlewares/multer.middleware");
const addCoordinateMarks = require("./util/addCoordinateMarks")


// middleware
const authMiddleware = (req, res, next) => {
    const authorization_header = req.headers.authorization;
    if (!authorization_header) {
        return res.status(400).json({ message: "Token is missing in request." });
    }
    const token = authorization_header.split(" ")[1];
    if (!token) {
        return res.status(400).json({ message: "Token format is incorrect." });
    }

    jwt.verify(token, "secret_key", function (err, decoded) {
        if (err) {
            return res.status(400).json({ message: "Login first" });
        } else {
            let userId;
            if (decoded.userId) {
                userId = decoded.userId;
                req.userId = userId;
            }
            next();
        }
    });
};

app.get("/", async (req, res) => {
    res.json({
        isError: false,
        message: "hello world!",
    });
});

app.post("/login", async (req, res) => {
    try {
        const { empId, password } = req.body;
        const query = `select * from appUsers where userId = ${empId}`;
        const user = await connection.query(query, {
            type: connection.QueryTypes.SELECT,
        });

        if (user.length > 0) {
            if (user[0].userId == empId && user[0].passwordHash === password) {
                var token = jwt.sign(
                    {
                        userId: user[0].userId,
                    },
                    "secret_key"
                );
                res.json({
                    message: "Logged in successfully",
                    token: token,
                    userRole: user[0].role,
                    userName: user[0].userName,
                    userId: user[0].userId,
                });
            } else {
                res.json({
                    isError: false,
                    message: "Wrong Password",
                });
            }
        } else {
            res.json({
                isError: false,
                message: "Invalid employeeid, id not found in database",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: "Invalid employeeid, id not found",
            isError: true,
            error: error.message,
        });
    }
});


app.patch('/changepassword', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword } = req.body;
        console.log(req.body)

        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const query1 = `select * from appUsers where userId = ${userId}`;
        const data = await connection.query(query1, {
            type: connection.QueryTypes.SELECT,
        });


        if (data.length > 0) {
            if (data[0].userId === userId && data[0].passwordHash === oldPassword) {
                console.log("changing password")
                const query2 = `update appUsers set passwordHash = ? where userId = ?`;
                const result = await connection.query(query2, {
                    replacements: [newPassword, userId],
                    type: connection.QueryTypes.UPDATE,
                });

                if (result[1] > 0) {
                    res.status(200).json({
                        isError: false,
                        message: "Password changed successful",
                    });
                } else {
                    return res.status(404).json({
                        isError: true,
                        message: "Password update failed",
                    });
                }


            } else {
                res.json({
                    isError: false,
                    message: "Invalid user Id or Password.",
                });
            }
        } else {
            res.json({
                isError: false,
                message: "Invalid employeeid, id not found in database",
            });
        }

    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})


app.get('/attendance/status/:userId?', authMiddleware, async (req, res) => {
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
        }
        else if (!userId && !status && !date) {
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

        res.status(200).json({
            isError: false,
            message: "attendance status fetched successfully",
            data,
        });

    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})

app.get('/attendance/logs/:attendanceId?', authMiddleware, async (req, res) => {
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
})


app.post('/attendance/checkin', authMiddleware, async (req, res) => {
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
});

app.patch('/attendance/checkout', authMiddleware, async (req, res) => {
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
});

app.post('/attendance/locationlog', authMiddleware, async (req, res) => {
    try {
        console.log(req.body)
        const userId = req.userId;
        const { attendanceId, lat, long } = req.body;
        if (!userId || !attendanceId || !lat || !long) {
            return res.status(400).json({ message: "All parameters are rewuired" });
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
});



app.post('/dailyexpenses', authMiddleware, uploadMiddleware.single("file"), async (req, res) => {
    try {
        const userId = req.userId;
        const { expenseCategory, expenseDescription, amount, expenseDate, latitude, longitude } = req.body;

        if (!userId || !req.file || !expenseCategory || !expenseDescription || !expenseDate || !amount || !latitude || !longitude) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const localFileName = req.file.filename;
        const localFilePath = req.file.path;

        addCoordinateMarks(localFilePath, latitude, longitude, res);

        const query = `
              INSERT INTO employeeDailyExpenses (UserId, expenseDate, expenseCategory,  expenseDescription , amount,  expenseImg, createdAt )
              VALUES (?, GETDATE(), ?, ?, ?, ?, GETDATE())
          `;
        const result = await connection.query(query, {
            replacements: [userId, expenseCategory, expenseDescription, amount, localFileName],
            type: connection.QueryTypes.INSERT,
        });

        if (result[1] > 0) {
            return res.json({ message: "Daily expense submitted successfully." });
        } else {
            return res.status(500).json({ message: "Daily expense submission failed." });
        }

    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})

app.patch('/dailyexpenses', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { expenseID, action, rejectionReason } = req.body;
        console.log(req.body);
        if (!userId || !expenseID || !action) {
            return res.status(400).json({ message: "All fields are required." });
        }

        let query1 = `select status from employeeDailyExpenses where expenseID = '${expenseID}'`
        const data = await connection.query(query1, {
            type: connection.QueryTypes.SELECT,
        });
        let query2;
        let result;
        if (data.length > 0 && data[0].status === "Pending" && action === "Approved") {
            query2 = `update employeeDailyExpenses set approvedBy = ?, approvedAt = GETDATE(), status = ? where expenseId = ?;`
            result = await connection.query(query2, {
                replacements: [userId, action, expenseID],
                type: connection.QueryTypes.EXECUTE,
            })
        } else if (data.length > 0 && data[0].status === "Pending" && action === "Rejected") {
            if (!rejectionReason) return res.status(400).json({ message: "All fields are required...." });
            query2 = `update employeeDailyExpenses set rejectedBy = ?, rejectedAt = GETDATE(), rejectionReason = ? , status = ? where expenseID = ?`
            result = await connection.query(query2, {
                replacements: [userId, rejectionReason, action, expenseID],
                type: connection.QueryTypes.EXECUTE,
            })
        } else {
            return res.status(400).json({ message: "Invalid action." });
        }

        if (result[1] > 0) {
            return res.json({ message: "Daily Expense application updated successfully." });
        } else {
            return res.status(500).json({ message: "Daily Expense application updation failed." });
        }


    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})

app.get('/dailyexpenses/:userId?', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        let query;
        let query2;
        if (userId) {
            query = `select  u.userName , e.* from appUsers u join employeeDailyExpenses e
                     on u.userId = e.userId where e.userId = ${userId} order by e.createdAt desc`
            query2 = `SELECT 
                      SUM(amount) AS totalRequestedAmount,
                      SUM(CASE WHEN status = 'Approved' THEN amount ELSE 0 END) AS totalApprovedAmount,
                      SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) AS totalPendingAmount,
                      SUM(CASE WHEN status = 'Rejected' THEN amount ELSE 0 END) AS totalRejectedAmount
                      FROM employeeDailyExpenses where userId = ${userId};`
        } else {
            query = `select  u.userName , e.* from appUsers u join employeeDailyExpenses e
                     on u.userId = e.userId order by e.createdAt desc`
            query2 = `SELECT 
                      SUM(amount) AS totalRequestedAmount,
                      SUM(CASE WHEN status = 'Approved' THEN amount ELSE 0 END) AS totalApprovedAmount,
                      SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) AS totalPendingAmount,
                      SUM(CASE WHEN status = 'Rejected' THEN amount ELSE 0 END) AS totalRejectedAmount
                      FROM employeeDailyExpenses;`
        }

        const data = await connection.query(query, {
            type: connection.QueryTypes.SELECT,
        });
        const amount = await connection.query(query2, {
            type: connection.QueryTypes.SELECT,
        });

        if (data.length > 0) {
            data.forEach(item => {
                if (item.expenseImg) {
                    // item.image = `${req.protocol}://${req.get('host')}/images/${item.expenseImg}`;
                    item.image = `https://468fsrq8-8080.inc1.devtunnels.ms/images/${item.expenseImg}`;  //tunnel url for testing
                    delete item.expenseImg;
                }
            });
        }

        res.status(200).json({
            isError: false,
            message: "Daily expenses fetched successfully",
            data,
            amount: amount[0]
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})

app.get('/data', async (req, res) => {
    try {
        const attendance = await connection.query('SELECT *  FROM locationLogs', {
            type: connection.QueryTypes.DELETE,
        });

        const locationLogs = await connection.query('SELECT * FROM Attendance', {
            type: connection.QueryTypes.SELECT,
        });
        res.status(201).json({
            isError: false,
            message: "Attendance & locationLogs fetched successfully.",
            attendance,
            locationLogs,
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})
app.delete('/delete', async (req, res) => {
    try {
        await connection.query('DELETE FROM locationLogs', {
            type: connection.QueryTypes.DELETE,
        });

        await connection.query('DELETE FROM Attendance', {
            type: connection.QueryTypes.DELETE,
        });

        res.status(201).json({
            isError: false,
            message: "Attendance & locationLogs deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})

// Route to fetch user attendance
app.get('/attendance/user', authMiddleware, async (req, res) => {
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
});

app.get('/leaves/:userId?', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        let query;
        let replacements = [];
        if (userId) {
            query = `SELECT r.LeaveId, r.UserId, r.LeaveType, CAST(r.StartDate AS DATE) AS StartDate, CAST(r.EndDate AS DATE) AS EndDate, r.Status, r.Reason, CAST(r.RequestedAt AS DATE) AS RequestedAt, r.ApprovedBy, CAST(r.ApprovedAt AS DATE) AS ApprovedAt, r.RejectedBy, CAST(r.RejectedAt AS DATE) as RejectedAt, 
                    b.year, 
                    b.totalLeaves, 
                    b.usedLeaves, 
                    b.remainingLeaves
                    FROM leaveBalance b
                    LEFT JOIN LeaveRequests r ON r.UserId = b.UserId
                    WHERE b.UserId = ? order by r.RequestedAt desc`
            replacements = [userId];
        } else {
            query = `SELECT r.LeaveId, r.UserId, r.LeaveType, CAST(r.StartDate AS DATE) AS StartDate, CAST(r.EndDate AS DATE) AS EndDate, r.Status, r.Reason, CAST(r.RequestedAt AS DATE) AS RequestedAt, r.ApprovedBy, CAST(r.ApprovedAt AS DATE) AS ApprovedAt, r.RejectedBy, CAST(r.RejectedAt AS DATE) as RejectedAt, 
                    b.year, 
                    b.totalLeaves, 
                    b.usedLeaves, 
                    b.remainingLeaves,
                    u.userName
                    FROM leaveBalance b
                    LEFT JOIN LeaveRequests r ON r.UserId = b.UserId
                    join appUsers u on r.userId = u.userId
                    order by r.RequestedAt desc`
        }

        const data = await connection.query(query, {
            replacements,
            type: connection.QueryTypes.SELECT,
        });

        res.json({
            isError: false,
            message: "Leaves fetched successfully",
            data
        });
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
});

//need to improve
app.patch('/leaveaction/:action?/:leaveId?', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { action, leaveId } = req.params;
        const { applicantUserId } = req.body;

        if (!leaveId || !applicantUserId || !action || !userId) {
            return res.status(400).json({ message: "All fields are required." });
        }

        let query = `EXEC approveLeaveUpdated @LeaveId = ?, @applicantUserId= ?,  @actionId = ?, @action = ?`
        const result = await connection.query(query, {
            replacements: [leaveId, applicantUserId, userId, action],
            type: connection.QueryTypes.EXECUTE,
        })

        console.log(result);
        if (result[1] > 0) {
            return res.json({ message: "Leave application updated successfully." });
        } else {
            return res.status(500).json({ message: "Leave application updation failed." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
})

app.post('/leaveapplication', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { subject, leaveType, startDate, endDate } = req.body;

        if (!subject || !leaveType || !startDate || !endDate || !userId) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: "End date must be after start date." });
        }

        //Parameterized query to prevent SQL injection
        const query = `
            INSERT INTO LeaveRequests (UserId, Reason, LeaveType, StartDate, EndDate)
            VALUES (?, ?, ?, CAST(? AS DATE), CAST(? AS DATE))
        `;

        const result = await connection.query(query, {
            replacements: [userId, subject, leaveType, startDate, endDate],
            type: connection.QueryTypes.INSERT,
        });

        console.log("result", result)


        if (result[1] > 0) {
            return res.json({ message: "Leave application submitted successfully." });
        } else {
            return res.status(500).json({ message: "Leave application submission failed." });
        }


    } catch (error) {
        console.error(error);
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
});

// sales leads
app.post("/saleslead/add", authMiddleware, async (req, res) => {
    const userId = req.userId;
    try {
        const { firmname, groweraddress, growerreference, leadtype, growercell, areakanal, areamarla, sitelocation, latitude, longitude } = req.body;
        if (!firmname || !groweraddress || !growerreference || !leadtype || !growercell || !areakanal || !areamarla || !sitelocation || !latitude || !longitude) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const maxWidQuery = `SELECT MAX(wid) AS max_wid FROM subwrk3`;
        const [maxWidResult] = await connection.query(maxWidQuery);
        let maxWid = maxWidResult[0].max_wid || 0;
        maxWid += 1;

        const query = `
            INSERT INTO subwrk3 (wid, sname, firm, gaddress, growerreference, leadtype, gcellno ,mcrates, marla, glocation, latitude, longitude, tdate, eid)
            VALUES (?, 'Abraq Nurseries LLP', ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, GETDATE(), ?)`;

        const result = await connection.query(query, {
            replacements: [maxWid, firmname, groweraddress, growerreference, leadtype, growercell, areakanal, areamarla, sitelocation, latitude, longitude, userId],
            type: connection.QueryTypes.INSERT,
        });

        if (result[1] > 0) {
            return res.json({ message: "Sales Lead submitted successfully." });
        } else {
            return res.status(500).json({ message: "Sales Lead submission failed." });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({
            isError: true,
            error: error.message,
        });
    }
});

app.put("/saleslead/update/:wid", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { wid } = req.params;

    try {
        const {
            firmname, groweraddress, growerreference, leadtype, growercell, areakanal, areamarla, sitelocation, latitude, longitude,
        } = req.body;

        // Validate required fields
        if (!firmname || !groweraddress || !growerreference || !leadtype || !growercell || !areakanal || !areamarla || !sitelocation || !latitude || !longitude) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if there's a sales lead
        const existingLead = await connection.query(
            `SELECT wid FROM subwrk3 WHERE wid = ? `,
            {
                replacements: [wid],
                type: connection.QueryTypes.SELECT,
            }
        );

        if (existingLead.length === 0) {
            return res.status(400).json({ message: "No active check-in found for today" });
        }

        const query = `
            UPDATE subwrk3
            SET firm = ?, gaddress = ?, growerreference = ?, leadtype = ?, gcellno = ?, mcrates = ?, marla = ?, glocation = ?, latitude = ?, longitude = ?, eid = ?
            WHERE wid = ?
        `;

        const result = await connection.query(query, {
            replacements: [
                firmname, groweraddress, growerreference, leadtype, growercell, areakanal, areamarla, sitelocation, latitude, longitude, userId, wid,
            ],
            type: connection.QueryTypes.UPDATE,
        });

        console.log(result)
        if (result[1] > 0) {
            return res.json({ message: "Sales Lead updated successfully." });
        } else {
            return res.status(404).json({ message: "Sales Lead not found or update failed." });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({
            isError: true,
            error: error.message,
        });
    }
});

app.get("/saleslead", authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                isError: true,
                error: "Page and limit must be positive integers.",
            });
        }

        const query = ` SELECT wid, firm AS firmname, gaddress AS groweraddress, growerreference, leadtype, gcellno AS growercell, 
                        mcrates AS areakanal, marla AS areamarla, glocation AS sitelocation, latitude, longitude, CAST(tdate as date) as date, eid AS employeeId
                        FROM subwrk3
                        ORDER BY tdate DESC
                        OFFSET ? ROWS
                        FETCH NEXT ? ROWS ONLY`;

        const data = await connection.query(query, {
            replacements: [offset, limit],
            type: connection.QueryTypes.SELECT,
        });

        // Get the total count of records (for pagination info)
        const countQuery = `SELECT COUNT(*) as totalCount FROM subwrk3`;
        const [totalCountResult] = await connection.query(countQuery, {
            type: connection.QueryTypes.SELECT,
        });
        const totalCount = totalCountResult.totalCount;

        res.status(200).json({
            isError: false,
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            isError: true,
            error: error.message,
        });
    }
});


app.get('/growerdetails', authMiddleware, async (req, res) => {
    try {
        const { id, name, prname, limit = 5, offset = 0 } = req.query;
        // Base query
        let query = `SELECT wid as id, gname as growerName, prname as ParentName, cellno as contactNo , addr as address,
                     lat as latitude, longi as longitude FROM gragreement WHERE 1=1`;

        const replacements = [];
        if (id) {
            query += ` AND wid = ?`;
            replacements.push(id);
        }
        if (name) {
            query += ` AND gname LIKE ?`;
            replacements.push(`%${name}%`);
        }
        if (prname) {
            query += ` AND prname LIKE ?`;
            replacements.push(`%${prname}%`);
        }

        query += `order by gname OFFSET ? Rows
                  FETCH NEXT ? ROW ONLY`;
        replacements.push(parseInt(offset), parseInt(limit),);

        // Execute query
        const data = await connection.query(query, {
            replacements,
            type: connection.QueryTypes.SELECT,
        });

        console.log(__dirname)
        if (id && data.length === 1) {
            const pdfPath = path.join(__dirname, 'growerLayouts', `${id}.pdf`); 

            if (fs.existsSync(pdfPath)) {
                // item.image = `${req.protocol}://${req.get('host')}/images/${item.expenseImg}`;
                data[0].pdfLink = `https://468fsrq8-8080.inc1.devtunnels.ms/growerLayouts/${id}.pdf`
            } else {
                data[0].pdfLink = null;
            }
        }


        res.json({
            isError: false,
            message: "Grower details fetched successfully.",
            data,
        });
    } catch (error) {
        console.log(error.message)
        res.status(400).json({
            isError: true,
            error: error.message,
        });
    }
});


server.listen((8080), () => {
    connection.authenticate().then(() => {
        console.log("Connected to DB")
    }).catch((err) => {
        console.log("Error in connecting DB : ", err)
    })
    console.log("App listening on port 8080")
})












io.on("connection", (socket) => {
    console.log("user conected, User Id : ", socket.id)
})


const userNamespace = io.of('/appUsers');
const adminNamespace = io.of('/admins');

userNamespace.on('connection', (socket) => {
    console.log('User connected to /appUsers', socket.id);

    socket.on('send-location', (data) => {
        console.log("appUsers sent : ", data)
        adminNamespace.emit('receive-location', { id: socket.id, ...data });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        adminNamespace.emit('user-disconnected', socket.id);
    });
});


adminNamespace.on('connection', (socket) => {
    console.log('Admin connected to /admins', socket.id);

    socket.on('receive-location', (data) => {
        console.log('Admin received location:', data);
    });
});