// Railway 會直接提供環境變數，不需要 dotenv
// require('dotenv').config();
const { testConnection, initializeTables } = require('../config/database');
const { logInfo, logError } = require('../utils/logger');

/**
 * 初始化資料庫
 */
async function initDatabase() {
    console.log('🚀 開始初始化 Bookwise 資料庫...\n');

    try {
        // 測試資料庫連線
        console.log('📡 測試資料庫連線...');
        const isConnected = await testConnection();
        
        if (!isConnected) {
            console.error('❌ 資料庫連線失敗，請檢查以下設定：');
            console.error('   - MySQL 服務是否已啟動');
            console.error('   - .env 檔案中的資料庫設定是否正確');
            console.error('   - 資料庫是否已建立');
            process.exit(1);
        }

        // 初始化資料表
        console.log('📋 建立資料庫表格...');
        await initializeTables();

        console.log('\n✅ 資料庫初始化完成！');
        console.log('📊 已建立以下資料表：');
        console.log('   - users (使用者資料)');
        console.log('   - categories (記帳分類)');
        console.log('   - expenses (記帳記錄)');
        console.log('\n🎉 現在可以啟動伺服器了！');

    } catch (error) {
        logError('資料庫初始化失敗:', { error: error.message });
        console.error('\n❌ 資料庫初始化失敗:', error.message);
        console.error('💡 請檢查錯誤日誌：server/logs/error.log');
        process.exit(1);
    }
}

// 如果直接執行此檔案，則進行初始化
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase }; 