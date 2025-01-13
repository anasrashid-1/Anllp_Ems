const connection = require("../config/connect.mssql");

const getLeaves = async (req, res) => {
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
}

const patchLeaves = async (req, res) => {
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
}

const postLeaves = async (req, res) => {
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
}

module.exports = {getLeaves, patchLeaves, postLeaves};