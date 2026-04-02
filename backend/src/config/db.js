const mysql = require('mysql2/promise');
require('dotenv').config();

// Cria um "Pool" de conexões. É muito mais eficiente que criar uma conexão única, 
// pois ele gerencia as conexões que estão ociosas e as reaproveita.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;