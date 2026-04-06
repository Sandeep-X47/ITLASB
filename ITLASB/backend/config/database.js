const mysql = require('mysql2/promise');
require('dotenv').config();

const logisticsPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_LOGISTICS,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const authPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_AUTH,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = { logisticsPool, authPool };
