const connection = require("../config/connect.mssql");

const postTechnicalAdvice = async (req, res) => {
    const userId = req.userId; // Logged-in employee's ID
    try {
        const {
            growerId,
            adviseDate,
            sprinting,
            motility,
            diseases,
            recomendations,
            remarks,
        } = req.body;

        // Validate required fields
        if (!growerId || !adviseDate) {
            return res.status(400).json({ message: "growerId and adviseDate are required." });
        }

        const query = `
            INSERT INTO technicalAdvice (
                growerId,
                employeeId,
                adviseDate,
                sprinting,
                motility,
                diseases,
                recomendations,
                remarks
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(query, {
            replacements: [
                growerId,
                userId,
                adviseDate,
                sprinting || null,
                motility || null,
                diseases || null,
                recomendations || null,
                remarks || null
            ],
            type: connection.QueryTypes.INSERT,
        });

        res.status(201).json({ message: "Technical advice submitted successfully." });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            isError: true,
            error: error.message,
        });
    }
};

const getTechnicalAdvices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const growerId = req.query.growerId;

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                isError: true,
                error: "Page and limit must be positive integers.",
            });
        }

        let whereClause = "";
        let replacements = [offset, limit];

        if (growerId) {
            whereClause = "WHERE growerId = ?";
            replacements = [growerId, offset, limit];
        }

        const query = `
            SELECT 
                adviseId,
                growerId,
                employeeId,
                CAST(adviseDate AS date) AS adviseDate,
                sprinting,
                motility,
                diseases,
                recomendations,
                remarks
            FROM technicalAdvice
            ${whereClause}
            ORDER BY adviseDate DESC
            OFFSET ? ROWS
            FETCH NEXT ? ROWS ONLY
        `;

        const data = await connection.query(query, {
            replacements,
            type: connection.QueryTypes.SELECT,
        });

        // Total count
        let countQuery = `SELECT COUNT(*) as totalCount FROM technicalAdvice`;
        let countReplacements = [];

        if (growerId) {
            countQuery += ` WHERE growerId = ?`;
            countReplacements.push(growerId);
        }

        const [totalCountResult] = await connection.query(countQuery, {
            replacements: countReplacements,
            type: connection.QueryTypes.SELECT,
        });

        const totalCount = totalCountResult.totalCount;

        res.status(200).json({
            isError: false,
            data,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            isError: true,
            error: error.message,
        });
    }
};

module.exports = { postTechnicalAdvice, getTechnicalAdvices };
