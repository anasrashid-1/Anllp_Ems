const connection = require("../config/connect.mssql");
const postSalesLead = async (req, res) => {
    const userId = req.userId;
    try {
        const { firmname, groweraddress, growerreference, leadtype, growercell, areakanal, areamarla, sitelocation, latitude, longitude } = req.body;
        if (!firmname || !groweraddress || !growerreference || !leadtype || !growercell || !areakanal || !areamarla || !sitelocation || !latitude || !longitude) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const maxWidQuery = `SELECT MAX(wid) AS max_wid FROM subwrk3Test`;
        const [maxWidResult] = await connection.query(maxWidQuery);
        let maxWid = maxWidResult[0].max_wid || 0;
        maxWid += 1;

        const query = `
            INSERT INTO subwrk3Test (wid, sname, firm, gaddress, growerreference, leadtype, gcellno ,mcrates, marla, glocation, latitude, longitude, tdate, eid)
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
}

const putSalesLead = async (req, res) => {
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
            `SELECT wid FROM subwrk3Test WHERE wid = ? `,
            {
                replacements: [wid],
                type: connection.QueryTypes.SELECT,
            }
        );

        if (existingLead.length === 0) {
            return res.status(400).json({ message: "No active check-in found for today" });
        }

        const query = `
            UPDATE subwrk3Test
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
}

const getSalesLead = async (req, res) => {
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
                        FROM subwrk3Test
                        ORDER BY tdate DESC
                        OFFSET ? ROWS
                        FETCH NEXT ? ROWS ONLY`;

        const data = await connection.query(query, {
            replacements: [offset, limit],
            type: connection.QueryTypes.SELECT,
        });

        // Get the total count of records (for pagination info)
        const countQuery = `SELECT COUNT(*) as totalCount FROM subwrk3Test`;
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
}

module.exports = {postSalesLead, putSalesLead, getSalesLead}