const Sequelize = require('sequelize');

const connection = new Sequelize("EMSDB","dev","123",{
        host: "localhost",
        dialect: "mssql",
    }
)

module.exports = connection;