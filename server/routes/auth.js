const express = require('express');
const router = express.Router();

// 中間件
const { authenticateToken } = require('../middleware/auth');
const { 
    validateRegister, 
    validateLogin, 
    sanitizeInput 
} = require('../middleware/validation');

// 控制器
const {
    register,
    login,
    logout,
    getProfile,
    verifyToken,
    updateProfile
} = require('../controllers/authController');

/**
 * 身份驗證相關路由
 * 基礎路徑: /api/auth
 */

/**
 * POST /api/auth/register
 * 使用者註冊
 * 公開端點，不需要身份驗證
 */
router.post('/register', 
    sanitizeInput,           // 清理輸入資料
    validateRegister,        // 驗證註冊資料
    register                 // 處理註冊邏輯
);

/**
 * POST /api/auth/login
 * 使用者登入
 * 公開端點，不需要身份驗證
 */
router.post('/login',
    sanitizeInput,           // 清理輸入資料
    validateLogin,           // 驗證登入資料
    login                    // 處理登入邏輯
);

/**
 * GET /api/auth/profile
 * 獲取當前使用者個人資料
 * 需要身份驗證
 */
router.get('/profile',
    authenticateToken,       // 驗證 JWT token
    getProfile               // 回傳使用者資料
);

/**
 * PUT /api/auth/profile
 * 更新使用者個人資料
 * 需要身份驗證
 */
router.put('/profile',
    authenticateToken,       // 驗證 JWT token
    sanitizeInput,           // 清理輸入資料
    // 注意: 更新個人資料的驗證規則稍後可以增加
    updateProfile            // 處理更新邏輯
);

/**
 * POST /api/auth/logout
 * 使用者登出
 * 需要身份驗證
 */
router.post('/logout',
    authenticateToken,       // 驗證 JWT token
    logout                   // 處理登出邏輯
);

/**
 * GET /api/auth/verify
 * 驗證 JWT token 是否有效
 * 需要身份驗證
 */
router.get('/verify',
    authenticateToken,       // 驗證 JWT token
    verifyToken              // 回傳驗證結果
);

/**
 * GET /api/auth/test
 * 測試端點 - 檢查身份驗證中間件是否正常運作
 * 需要身份驗證
 */
router.get('/test',
    authenticateToken,
    (req, res) => {
        res.json({
            success: true,
            message: '身份驗證測試成功',
            data: {
                user: req.user.toJSON(),
                timestamp: new Date().toISOString()
            }
        });
    }
);

module.exports = router; 