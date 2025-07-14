const mysql = require('mysql2/promise');
const { logError, logInfo } = require('../utils/logger');

// Railway 會直接提供環境變數，不需要 dotenv
// require('dotenv').config();

// 資料庫連線配置
const dbConfig = {
    host: process.env.DB_HOST || 'mysql.railway.internal',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ziYjdllesNJHAiQupdvQnWZRlrCXBfPg',
    database: process.env.DB_NAME || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    multipleStatements: false
};

// 建立連線池
const pool = mysql.createPool(dbConfig);

/**
 * 測試資料庫連線
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        logInfo('✅ 資料庫連線成功');
        connection.release();
        return true;
    } catch (error) {
        logError('❌ 資料庫連線失敗:', { error: error.message });
        return false;
    }
}

/**
 * 執行 SQL 查詢
 * @param {string} query SQL 查詢語句
 * @param {Array} params 查詢參數
 * @returns {Promise} 查詢結果
 */
async function executeQuery(query, params = []) {
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        logError('SQL 查詢錯誤:', { 
            query, 
            params, 
            error: error.message 
        });
        throw error;
    }
}

/**
 * 執行事務
 * @param {Function} callback 事務回調函數
 * @returns {Promise} 事務結果
 */
async function executeTransaction(callback) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        logError('事務執行失敗:', { error: error.message });
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 初始化資料庫表格
 */
async function initializeTables() {
    try {
        // 建立使用者表
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        // 建立記帳分類表
        const createCategoriesTable = `
            CREATE TABLE IF NOT EXISTS categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                color VARCHAR(7) DEFAULT '#007bff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_type (user_id, type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        // 建立記帳記錄表
        const createExpensesTable = `
            CREATE TABLE IF NOT EXISTS expenses (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                category_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                transaction_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
                INDEX idx_user_date (user_id, transaction_date),
                INDEX idx_category (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await executeQuery(createUsersTable);
        await executeQuery(createCategoriesTable);
        await executeQuery(createExpensesTable);

        logInfo('✅ 資料庫表格初始化完成');
    } catch (error) {
        logError('❌ 資料庫表格初始化失敗:', { error: error.message });
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    executeQuery,
    executeTransaction,
    initializeTables
}; 