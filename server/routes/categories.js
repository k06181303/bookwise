const express = require('express');
const router = express.Router();

// 中間件
const { authenticateToken } = require('../middleware/auth');
const { 
    validateCategory, 
    sanitizeInput 
} = require('../middleware/validation');

// 控制器
const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    initDefaultCategories,
    getCategoryStats
} = require('../controllers/categoryController');

/**
 * 分類管理相關路由
 * 基礎路徑: /api/categories
 * 所有路由都需要身份驗證
 */

/**
 * GET /api/categories
 * 獲取使用者的所有分類
 * Query 參數: type ('income' | 'expense')
 */
router.get('/',
    authenticateToken,           // 驗證 JWT token
    getCategories                // 獲取分類列表
);

/**
 * GET /api/categories/:id
 * 獲取單一分類詳細資訊
 */
router.get('/:id',
    authenticateToken,           // 驗證 JWT token
    getCategoryById              // 獲取分類詳情
);

/**
 * POST /api/categories
 * 建立新分類
 */
router.post('/',
    authenticateToken,           // 驗證 JWT token
    sanitizeInput,               // 清理輸入資料
    validateCategory,            // 驗證分類資料
    createCategory               // 建立分類
);

/**
 * PUT /api/categories/:id
 * 更新分類
 */
router.put('/:id',
    authenticateToken,           // 驗證 JWT token
    sanitizeInput,               // 清理輸入資料
    // 注意: 更新時不需要完整的 validateCategory，因為 type 不能修改
    updateCategory               // 更新分類
);

/**
 * DELETE /api/categories/:id
 * 刪除分類
 */
router.delete('/:id',
    authenticateToken,           // 驗證 JWT token
    deleteCategory               // 刪除分類
);

/**
 * POST /api/categories/init-defaults
 * 為使用者初始化預設分類
 */
router.post('/init-defaults',
    authenticateToken,           // 驗證 JWT token
    initDefaultCategories        // 初始化預設分類
);

/**
 * GET /api/categories/:id/stats
 * 獲取分類的使用統計
 */
router.get('/:id/stats',
    authenticateToken,           // 驗證 JWT token
    getCategoryStats             // 獲取分類統計
);

module.exports = router; 