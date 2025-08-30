const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a pool of connections to the database
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Pr@n@v7722A",
    database: "lsreborn",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("MySQL Connection Pool created.");

module.exports = pool;