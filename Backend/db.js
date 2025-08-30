const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a pool of connections to the database
const pool = mysql.createPool({
    host: "lsreborn-db-lsreborn-project.d.aivencloud.com",
    user: "avnadmin",
    password: "AVNS_cKRmttkqfB5THos3bSX",
    database: "defaultdb",
    port: 26342,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("MySQL Connection Pool created.");

module.exports = pool;