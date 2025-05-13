const connection = require("../config/connect.mssql");
const jwt = require("jsonwebtoken");


const login = async (req, res) => {
    try {
        const { empId, password, deviceId, deviceName } = req.body;
        const query = `select * from appUsers where userId = ${empId}`;
        const user = await connection.query(query, {
            type: connection.QueryTypes.SELECT,
        });
        if (user.length > 0) {
            if (user[0].userId == empId && user[0].passwordHash === password) {

                // If device info is provided, update the user record
                if (deviceId || deviceName) {
                    const updateQuery = `
                        UPDATE appUsers
                        SET 
                            deviceID = ${deviceId ? `'${deviceId}'` : 'NULL'},
                            deviceName = ${deviceName ? `'${deviceName}'` : 'NULL'}
                        WHERE userId = ${empId}
                    `;
                    await connection.query(updateQuery);
                }

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
}

const changePassword = async (req, res) => {
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
}


module.exports = { login, changePassword };
