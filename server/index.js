// Railway 會直接提供環境變數，不需要 dotenv
// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { logError, logInfo } = require('./utils/logger');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// 中間件設定
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 請求日誌中間件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 導入路由
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const expenseRoutes = require('./routes/expenses');

// 導入資料庫初始化函數
const { initializeTables } = require('./config/database');

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);

// 資料庫初始化端點
app.post('/api/init-db', async (req, res) => {
    try {
        console.log('🚀 開始初始化資料庫...');
        
        // 顯示當前資料庫配置
        console.log('📋 資料庫配置:');
        console.log('   DB_HOST:', process.env.DB_HOST);
        console.log('   DB_PORT:', process.env.DB_PORT);
        console.log('   DB_USER:', process.env.DB_USER);
        console.log('   DB_NAME:', process.env.DB_NAME);
        console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***已設置***' : '未設置');
        
        // 先測試連接
        await testConnection();
        console.log('✅ 連接測試成功');
        
        // 執行初始化
        await initializeTables();
        console.log('✅ 資料庫初始化完成！');
        
        res.json({ 
            success: true, 
            message: '資料庫初始化成功',
            timestamp: new Date().toISOString(),
            config: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                database: process.env.DB_NAME
            }
        });
    } catch (error) {
        console.error('❌ 資料庫初始化失敗:', error.message);
        console.error('❌ 錯誤堆疊:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: '資料庫初始化失敗',
            error: error.message,
            config: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                database: process.env.DB_NAME
            }
        });
    }
});

// 基本路由
app.get('/', (req, res) => {
    res.json({ 
        message: 'Bookwise API 伺服器正在運行', 
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            categories: '/api/categories',
            expenses: '/api/expenses',
            health: '/health'
        }
    });
});

// 健康檢查端點
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    const errorMessage = `錯誤發生於 ${req.method} ${req.path}: ${err.message}`;
    logError(errorMessage);
    
    console.error('伺服器錯誤:', err);
    res.status(500).json({ 
        error: '伺服器內部錯誤',
        message: process.env.NODE_ENV === 'development' ? err.message : '請聯繫系統管理員'
    });
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ 
        error: '找不到請求的資源',
        path: req.originalUrl 
    });
});

// 啟動伺服器
app.listen(PORT, async () => {
    console.log(`🚀 Bookwise 後端伺服器已啟動`);
    console.log(`📍 運行位址: http://localhost:${PORT}`);
    console.log(`🌍 環境模式: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📋 可用的 API 端點:`);
    console.log(`   🏠 基本資訊: GET ${PORT === 80 ? '' : ':' + PORT}/`);
    console.log(`   ❤️  健康檢查: GET ${PORT === 80 ? '' : ':' + PORT}/health`);
    console.log(`   🔐 身份驗證: ${PORT === 80 ? '' : ':' + PORT}/api/auth/*`);
    console.log(`   📂 分類管理: ${PORT === 80 ? '' : ':' + PORT}/api/categories/*`);
    console.log(`   💰 記帳記錄: ${PORT === 80 ? '' : ':' + PORT}/api/expenses/*`);
    console.log(`\n🧪 測試記帳系統:`);
    console.log(`   註冊: POST ${PORT === 80 ? '' : ':' + PORT}/api/auth/register`);
    console.log(`   登入: POST ${PORT === 80 ? '' : ':' + PORT}/api/auth/login`);
    console.log(`   初始化分類: POST ${PORT === 80 ? '' : ':' + PORT}/api/categories/init-defaults`);
    console.log(`   建立記帳: POST ${PORT === 80 ? '' : ':' + PORT}/api/expenses`);
    
    // 測試資料庫連接
    console.log(`\n📡 測試資料庫連接...`);
    try {
        await testConnection();
        console.log(`✅ 資料庫連接正常`);
        logInfo('伺服器啟動成功', { 
            port: PORT, 
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error(`❌ 資料庫連接失敗:`, error.message);
        logError('伺服器啟動時資料庫連接失敗', { 
            error: error.message,
            port: PORT 
        });
    }
});

module.exports = app; 