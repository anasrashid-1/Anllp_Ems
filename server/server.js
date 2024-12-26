const express = require("express");
const connection = require("./config/connect.mssql");
const moment = require('moment');

const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.use(express.json());
const jwt = require("jsonwebtoken");
const cors = require("cors");
app.use(cors());

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



app.get("/", (req, res) => {
    res.json({
        "message": "hi, there!"
    })
})

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
                    message: "Wrong Password",
                });
            }
        } else {
            res.json({
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




app.get('/attendance/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        console.log(userId)
        if (!userId) {
            return res.status(400).json({ message: "employeeid not found" });
        }

        const query = `select * from Attendance where userId = ? and attendanceDate = CAST(GETDATE() AS DATE)`;
        const replacements = [userId];
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





// app.get('/leaves/:userId?', authMiddleware, async (req, res) => {
//     try {
//         const { userId } = req.params;
//         console.log(userId);

//         let query;
//         let query2;
//         let replacements = [];
//         if (userId) {
//             query = `select * from  LeaveRequests where userId = ? order by RequestedAt DESC`;
//             query2 = `select * from leaveBalance where userId = ?`; 
//             replacements = [userId];
//         } else {
//             query = `select * from  LeaveRequests order by RequestedAt DESC`;
//             query2 = `select * from leaveBalance`;
//         }

//         const data = await connection.query(query, {
//             replacements,
//             type: connection.QueryTypes.SELECT,
//         });
//         const balance = await connection.query(query2, {
//             replacements,
//             type: connection.QueryTypes.SELECT,
//         });


//         res.json({
//             message: "Leaves fetched successfully",
//             data,
//             balance
//         });
//     } catch (error) {
//         res.status(500).json({
//             isError: true,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// });

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