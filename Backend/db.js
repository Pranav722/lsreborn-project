const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const sslOptions = {
    ca: fs.readFileSync(__dirname + '/ca.pem') // Assumes ca.pem is in the same directory
};

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslOptions, // Use the SSL options
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("MySQL Connection Pool created with SSL.");

module.exports = pool;