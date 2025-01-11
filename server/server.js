const express = require("express");
const connection = require("./config/connect.mssql");
const moment = require('moment');
const path = require("path");


const http = require('http');
const socketio = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

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
        const query = `select * from users where userId = ${empId}`;
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
        const query1 = `select * from users where userId = ${userId}`;
        const data = await connection.query(query1, {
            type: connection.QueryTypes.SELECT,
        });


        if (data.length > 0) {
            if (data[0].userId === userId && data[0].passwordHash === oldPassword) {
                console.log("changing password")
                const query2 = `update users set passwordHash = ? where userId = ?`;
                await connection.query(query2, {
                    replacements: [newPassword, userId],
                    type: connection.QueryTypes.UPDATE,
                });

                res.status(200).json({
                    isError: false,
                    message: "Password changed successful",
                });
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


// app.get('/attendance/status/:userId?', authMiddleware, async (req, res) => {
//     try {
//         // const userId = req.userId;
//         const { userId } = req.params;
//         console.log(userId)

//         let query;
//         if (userId) {
//             query = `select * from Attendance where userId = ? and attendanceDate = CAST(GETDATE() AS DATE)`;
//         } else {
//             query = `select * from Attendance where attendanceDate = CAST(GETDATE() AS DATE)`;
//         }

//         // const query = `select * from Attendance where userId = ? and attendanceDate = CAST(GETDATE() AS DATE)`;
//         const replacements = [userId];
//         const data = await connection.query(query, {
//             replacements,
//             type: connection.QueryTypes.SELECT,
//         });

//         res.status(200).json({
//             isError: false,
//             message: "attendance status fetched successfully",
//             data,
//         });

//     } catch (error) {
//         res.status(500).json({
//             isError: true,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// })

// attendance api
app.get('/attendance/status/:userId?', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, date } = req.query;
        let query;
        let replacements;
        if(userId && status && date){
            console.log(userId, status, date);
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from users u
                     inner join Attendance a on u.userId = a.userId and a.attendanceDate = CAST(? AS DATE)
                     and a.status = ? where a.userId = ?`
                     replacements = [date, status, userId];
        }else if (!userId && status && date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from users u inner join Attendance a on u.userId = a.userId 
                     and a.attendanceDate = CAST(? AS DATE) and a.status = ?`
            replacements = [date, status];
        } else if (!userId && !status && date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from users u left join Attendance a on u.userId = a.userId 
                     and a.attendanceDate = CAST(? AS DATE)`
            replacements = [date];
        } else if (!userId && status && !date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from users u inner join Attendance a on u.userId = a.userId 
                     and a.status = ?`
            replacements = [status];
        }
        else if (!userId && !status && !date) {
            query = `select u.userId, u.username, 
                     a.attendanceId, a.checkInTime, a.checkOutTime, a.sessionDuration, a.createdAt, a.attendanceDate, a.status
                     from users u left join Attendance a on u.userId = a.userId 
                     and a.attendanceDate = CAST(GETDATE() AS DATE)`
            replacements = [];
        } else if (userId && !status && !date) {
            query = `select * from Attendance where userId = ? and attendanceDate = CAST(GETDATE() AS DATE)`;
            replacements = [userId];
        } else{
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

app.get('/attendance/logs/:attendanceId?',authMiddleware, async (req, res) => {
    try {
        const attendanceId = req.params.attendanceId;
        if(!attendanceId){
            return res.status(400).json({ message: "Param is required" });
        }
        const query = `SELECT a.userID, u.username, l.*
                        FROM Attendance a
                        INNER JOIN locationLogs l ON a.attendanceId = l.attendanceId
                        INNER JOIN users u ON a.userId = u.userId 
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
            query = `select  u.userName , e.* from users u join employeeDailyExpenses e
                     on u.userId = e.userId where e.userId = ${userId} order by e.createdAt desc`
            query2 = `SELECT 
                      SUM(amount) AS totalRequestedAmount,
                      SUM(CASE WHEN status = 'Approved' THEN amount ELSE 0 END) AS totalApprovedAmount,
                      SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) AS totalPendingAmount,
                      SUM(CASE WHEN status = 'Rejected' THEN amount ELSE 0 END) AS totalRejectedAmount
                      FROM employeeDailyExpenses where userId = ${userId};`
        } else {
            query = `select  u.userName , e.* from users u join employeeDailyExpenses e
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
                    join users u on r.userId = u.userId
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


const userNamespace = io.of('/users');
const adminNamespace = io.of('/admins');

userNamespace.on('connection', (socket) => {
    console.log('User connected to /users', socket.id);

    socket.on('send-location', (data) => {
        console.log("users sent : ", data)
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