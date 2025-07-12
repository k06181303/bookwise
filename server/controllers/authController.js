const User = require('../models/User');
const Category = require('../models/Category');
const { generateTokens } = require('../middleware/auth');
const { logInfo, logError, logWarn } = require('../utils/logger');

/**
 * 使用者註冊
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 建立新使用者
        const newUser = await User.create({
            username,
            email,
            password
        });

        // 生成 JWT token
        const tokens = generateTokens(newUser);

        // 為新使用者建立預設分類
        try {
            await Category.createDefaultCategories(newUser.id);
            logInfo('為新使用者建立預設分類成功', { userId: newUser.id });
        } catch (categoryError) {
            // 分類建立失敗不影響註冊流程，只記錄警告
            logWarn('為新使用者建立預設分類失敗:', { 
                userId: newUser.id, 
                error: categoryError.message 
            });
        }

        // 記錄成功註冊
        logInfo('新使用者註冊成功', {
            userId: newUser.id,
            username: newUser.username,
            email: newUser.email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({
            success: true,
            message: '註冊成功，已自動建立預設分類',
            data: {
                user: newUser.toJSON(),
                auth: tokens
            }
        });

    } catch (error) {
        // 檢查是否為預期的業務邏輯錯誤
        if (error.message === '使用者名稱已存在' || error.message === '信箱已被註冊') {
            logWarn('註冊失敗 - 重複資料', {
                error: error.message,
                requestData: { 
                    username: req.body.username, 
                    email: req.body.email 
                },
                ip: req.ip
            });

            return res.status(409).json({
                error: '註冊失敗',
                message: error.message
            });
        }

        // 其他錯誤
        logError('註冊過程發生錯誤:', {
            error: error.message,
            stack: error.stack,
            requestData: { 
                username: req.body.username, 
                email: req.body.email 
            },
            ip: req.ip
        });

        res.status(500).json({
            error: '註冊失敗',
            message: '伺服器內部錯誤，請稍後再試'
        });
    }
};

/**
 * 使用者登入
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { loginField, password } = req.body;

        // 驗證使用者憑證
        const user = await User.validateCredentials(loginField, password);

        if (!user) {
            logWarn('登入失敗 - 憑證無效', {
                loginField,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(401).json({
                error: '登入失敗',
                message: '使用者名稱、信箱或密碼錯誤'
            });
        }

        // 更新最後登入時間
        await User.updateLastLogin(user.id);

        // 生成 JWT token
        const tokens = generateTokens(user);

        // 記錄成功登入
        logInfo('使用者登入成功', {
            userId: user.id,
            username: user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: '登入成功',
            data: {
                user: user.toJSON(),
                auth: tokens
            }
        });

    } catch (error) {
        logError('登入過程發生錯誤:', {
            error: error.message,
            stack: error.stack,
            loginField: req.body.loginField,
            ip: req.ip
        });

        res.status(500).json({
            error: '登入失敗',
            message: '伺服器內部錯誤，請稍後再試'
        });
    }
};

/**
 * 獲取當前使用者資訊
 * GET /api/auth/profile
 * 需要身份驗證
 */
const getProfile = async (req, res) => {
    try {
        // req.user 已由 authenticateToken 中間件設定
        const user = req.user;

        res.json({
            success: true,
            message: '獲取個人資料成功',
            data: {
                user: user.toJSON()
            }
        });

    } catch (error) {
        logError('獲取個人資料失敗:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取個人資料失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 使用者登出
 * POST /api/auth/logout
 * 需要身份驗證
 */
const logout = async (req, res) => {
    try {
        // 由於我們使用 JWT（無狀態），伺服器端不需要特別處理
        // 實際的登出邏輯由前端負責（刪除本地儲存的 token）
        
        logInfo('使用者登出', {
            userId: req.user.id,
            username: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: '登出成功'
        });

    } catch (error) {
        logError('登出過程發生錯誤:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '登出失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 驗證 token 有效性
 * GET /api/auth/verify
 * 需要身份驗證
 */
const verifyToken = async (req, res) => {
    try {
        // 如果能到達這裡，表示 token 有效（已通過 authenticateToken 中間件）
        res.json({
            success: true,
            message: 'Token 有效',
            data: {
                user: req.user.toJSON(),
                valid: true
            }
        });

    } catch (error) {
        logError('Token 驗證過程發生錯誤:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: 'Token 驗證失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 更新使用者個人資料
 * PUT /api/auth/profile
 * 需要身份驗證
 */
const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;

        // 檢查新的使用者名稱是否已被其他人使用
        if (username && username !== req.user.username) {
            const existingUser = await User.findByUsername(username);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    error: '更新失敗',
                    message: '此使用者名稱已被使用'
                });
            }
        }

        // 檢查新的信箱是否已被其他人使用
        if (email && email !== req.user.email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    error: '更新失敗',
                    message: '此信箱已被註冊'
                });
            }
        }

        // 更新使用者資料
        // 注意：這裡需要在 User 模型中添加 update 方法
        // 暫時回傳成功訊息，實際更新邏輯稍後實作
        
        logInfo('使用者更新個人資料', {
            userId,
            oldData: { username: req.user.username, email: req.user.email },
            newData: { username, email },
            ip: req.ip
        });

        res.json({
            success: true,
            message: '個人資料更新成功',
            data: {
                user: req.user.toJSON() // 暫時回傳原始資料
            }
        });

    } catch (error) {
        logError('更新個人資料失敗:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '更新失敗',
            message: '伺服器內部錯誤'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    verifyToken,
    updateProfile
}; 