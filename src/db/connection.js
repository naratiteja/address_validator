const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const logger = require('../utils/logger');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'address_validator',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

logger.info(`Database config host: ${dbConfig.host}:${dbConfig.port}, user: ${dbConfig.user}, database: ${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

// Function to verify pool connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('Database connection pool initialized successfully.');
    connection.release();
  } catch (error) {
    logger.error('Error connecting to the database: ' + error.message);
    // Note: We don't exit the process immediately to allow server to startup and return errors on API requests
  }
}

testConnection();

module.exports = pool;
