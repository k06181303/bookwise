const winston = require('winston');
const fs = require('fs');
const path = require('path');

// 確保 logs 目錄存在
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// 建立 Winston Logger 實例
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'bookwise-api' },
    transports: [
        // 錯誤日誌檔案 - 只記錄 error 等級
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // 一般日誌檔案 - 記錄所有等級
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// 開發環境下也輸出到 console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

/**
 * 記錄錯誤訊息到檔案
 * @param {string} message 錯誤訊息
 * @param {Object} meta 額外的錯誤資訊
 */
function logError(message, meta = {}) {
    logger.error(message, meta);
}

/**
 * 記錄資訊訊息
 * @param {string} message 資訊訊息
 * @param {Object} meta 額外資訊
 */
function logInfo(message, meta = {}) {
    logger.info(message, meta);
}

/**
 * 記錄警告訊息
 * @param {string} message 警告訊息
 * @param {Object} meta 額外資訊
 */
function logWarn(message, meta = {}) {
    logger.warn(message, meta);
}

/**
 * 記錄除錯訊息（僅開發環境）
 * @param {string} message 除錯訊息
 * @param {Object} meta 額外資訊
 */
function logDebug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
        logger.debug(message, meta);
    }
}

module.exports = {
    logger,
    logError,
    logInfo,
    logWarn,
    logDebug
}; 