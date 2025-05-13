const express = require("express");
const connection = require("./config/connect.mssql");
const cors = require("cors");
const path = require("path");
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/growerLayouts', express.static(path.join(__dirname, 'growerLayouts')));
app.use(cors());

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dailyExpensesRoutes = require("./routes/dailyExpensesRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const salesLeadRoutes = require("./routes/salesLeadsRoutes");
const growerRoutes = require("./routes/growerRoutes");
const technicalAdviceRoutes = require("./routes/technicalAdviceRoutes");


app.use('/api/auth', authRoutes);
app.use('/api/attendance',attendanceRoutes);
app.use('/api/dailyexpenses', dailyExpensesRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/saleslead', salesLeadRoutes);
app.use('/api/growerdetails', growerRoutes);
app.use('/api/technicaladvice', technicalAdviceRoutes);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacypolicy.html'));
});

server.listen((8090), () => {
    connection.authenticate().then(() => {
        console.log("Connected to DB")
    }).catch((err) => {
        console.log("Error in connecting DB : ", err)
    })
    console.log("App listening on port 8090")
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