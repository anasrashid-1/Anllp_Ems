const connection = require("../config/connect.mssql");
const addCoordinateMarks = require("../util/addCoordinateMarks")

const postDailyExpenses = async (req, res) => {
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
}

const patchDailyExpenses = async (req, res) => {
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
} 

const getDailyExpenses = async (req, res) => {
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
                    //item.image = `https://468fsrq8-8080.inc1.devtunnels.ms/images/${item.expenseImg}`;  //tunnel url for testing
                    item.image = `https://468fsrq8-8090.inc1.devtunnels.ms//images/${item.expenseImg}`;  //tunnel url for testing
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
}
module.exports = {postDailyExpenses, patchDailyExpenses, getDailyExpenses};