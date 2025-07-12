const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logError, logWarn } = require('../utils/logger');

/**
 * JWT 驗證中間件
 * 驗證請求中的 JWT token，並將使用者資訊添加到 req.user
 */
const authenticateToken = async (req, res, next) => {
    try {
        // 從 Header 中取得 Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: '存取被拒絕',
                message: '未提供身份驗證令牌'
            });
        }

        // 驗證 JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 從資料庫中查找使用者（確保使用者仍然存在）
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            logWarn('JWT 驗證失敗 - 使用者不存在', { 
                userId: decoded.userId,
                ip: req.ip 
            });
            
            return res.status(401).json({
                error: '身份驗證失敗',
                message: '使用者帳號不存在或已被停用'
            });
        }

        // 將使用者資訊添加到請求物件中
        req.user = user;
        
        // 繼續處理下一個中間件
        next();

    } catch (error) {
        // JWT 驗證錯誤處理
        if (error.name === 'JsonWebTokenError') {
            logWarn('無效的 JWT token', { 
                error: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(401).json({
                error: '身份驗證失敗',
                message: '無效的身份驗證令牌'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            logWarn('JWT token 已過期', { 
                expiredAt: error.expiredAt,
                ip: req.ip 
            });
            
            return res.status(401).json({
                error: '身份驗證已過期',
                message: '請重新登入'
            });
        }

        // 其他錯誤
        logError('JWT 中間件發生未知錯誤:', { 
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });

        return res.status(500).json({
            error: '伺服器內部錯誤',
            message: '身份驗證處理失敗'
        });
    }
};

/**
 * 可選的身份驗證中間件
 * 如果有提供 token 則驗證，沒有提供則繼續處理
 * 適用於某些端點可以以訪客或會員身份存取
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // 沒有 token，以訪客身份繼續
            req.user = null;
            return next();
        }

        // 有 token，嘗試驗證
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        req.user = user || null;
        next();

    } catch (error) {
        // 即使 token 無效，也以訪客身份繼續
        req.user = null;
        next();
    }
};

/**
 * 生成 JWT token
 * @param {Object} user 使用者物件
 * @returns {Object} 包含 token 和過期時間的物件
 */
const generateTokens = (user) => {
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email
    };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: 'bookwise-api'
        }
    );

    // 計算過期時間
    const decoded = jwt.decode(accessToken);
    const expiresAt = new Date(decoded.exp * 1000);

    return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        expiresAt: expiresAt.toISOString()
    };
};

/**
 * 檢查使用者是否為資源擁有者
 * @param {string} resourceUserId 資源所屬的使用者 ID
 */
const checkResourceOwnership = (resourceUserId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: '身份驗證失敗',
                message: '需要登入才能執行此操作'
            });
        }

        if (req.user.id !== parseInt(resourceUserId)) {
            logWarn('使用者嘗試存取他人資源', {
                userId: req.user.id,
                requestedResourceUserId: resourceUserId,
                ip: req.ip,
                path: req.path
            });

            return res.status(403).json({
                error: '存取被拒絕',
                message: '您沒有權限存取此資源'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateTokens,
    checkResourceOwnership
}; 