const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a pool of connections to the database
const pool = mysql.createPool({
    host: "20.40.56.61",
    user: "root",
    password: "YourStrongPassword",
    database: "lsrwebtest",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("MySQL Connection Pool created.");

module.exports = pool;