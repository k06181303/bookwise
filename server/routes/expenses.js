const express = require('express');
const router = express.Router();

// 中間件
const { authenticateToken } = require('../middleware/auth');
const { 
    validateExpense,
    validatePagination,
    validateDateRange,
    sanitizeInput 
} = require('../middleware/validation');

// 控制器
const {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getStatistics,
    quickExpense,
    bulkImport,
    getRecentExpenses,
    getClassifySuggestion
} = require('../controllers/expenseController');

/**
 * 記帳記錄相關路由
 * 基礎路徑: /api/expenses
 * 所有路由都需要身份驗證
 */

/**
 * GET /api/expenses/statistics
 * 獲取統計資料（需要放在 /:id 之前以避免路由衝突）
 * Query 參數: startDate, endDate, groupBy
 */
router.get('/statistics',
    authenticateToken,           // 驗證 JWT token
    getStatistics                // 獲取統計資料
);

/**
 * GET /api/expenses/recent
 * 獲取最近的交易記錄
 * Query 參數: limit
 */
router.get('/recent',
    authenticateToken,           // 驗證 JWT token
    getRecentExpenses            // 獲取最近記錄
);

/**
 * POST /api/expenses/quick
 * 快速記帳
 */
router.post('/quick',
    authenticateToken,           // 驗證 JWT token
    sanitizeInput,               // 清理輸入資料
    quickExpense                 // 快速記帳
);

/**
 * POST /api/expenses/bulk-import
 * 批量導入記帳記錄
 */
router.post('/bulk-import',
    authenticateToken,           // 驗證 JWT token
    sanitizeInput,               // 清理輸入資料
    bulkImport                   // 批量導入
);

/**
 * POST /api/expenses/classify-suggestion
 * 獲取分類建議（智能分類）
 */
router.post('/classify-suggestion',
    authenticateToken,           // 驗證 JWT token
    sanitizeInput,               // 清理輸入資料
    getClassifySuggestion        // 獲取分類建議
);

/**
 * GET /api/expenses
 * 獲取記帳記錄列表
 * Query 參數: page, limit, startDate, endDate, categoryId, type
 */
router.get('/',
    authenticateToken,           // 驗證 JWT token
    getExpenses                  // 獲取記帳記錄列表
);

/**
 * GET /api/expenses/:id
 * 獲取單一記帳記錄詳細資訊
 */
router.get('/:id',
    authenticateToken,           // 驗證 JWT token
    getExpenseById               // 獲取記帳記錄詳情
);

/**
 * POST /api/expenses
 * 建立新記帳記錄
 */
router.post('/',
    authenticateToken,           // 驗證 JWT token
    sanitizeInput,               // 清理輸入資料
    validateExpense,             // 驗證記帳記錄資料
    createExpense                // 建立記帳記錄
);

/**
 * PUT /api/expenses/:id
 * 更新記帳記錄
 */
router.put('/:id',
    authenticateToken,           // 驗證 JWT token
    sanitizeInput,               // 清理輸入資料
    validateExpense,             // 驗證記帳記錄資料
    updateExpense                // 更新記帳記錄
);

/**
 * DELETE /api/expenses/:id
 * 刪除記帳記錄
 */
router.delete('/:id',
    authenticateToken,           // 驗證 JWT token
    deleteExpense                // 刪除記帳記錄
);

module.exports = router; 