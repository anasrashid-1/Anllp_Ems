const connection = require("../config/connect.mssql");
const fs = require("fs");
const path = require("path");
const getGrowerDetails = async (req, res) => {
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
            const pdfPath = path.join(__dirname, '../growerLayouts', `${id}.pdf`); 
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
}

module.exports= {getGrowerDetails}