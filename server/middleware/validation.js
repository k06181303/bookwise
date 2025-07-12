const { body, validationResult } = require('express-validator');
const { logWarn } = require('../utils/logger');

/**
 * 處理驗證結果的中間件
 * 如果有驗證錯誤，回傳錯誤訊息並記錄日誌
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));

        logWarn('請求資料驗證失敗', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            errors: errorMessages,
            userAgent: req.get('User-Agent')
        });

        return res.status(400).json({
            error: '請求資料驗證失敗',
            message: '請檢查輸入的資料格式',
            details: errorMessages
        });
    }

    next();
};

/**
 * 使用者註冊驗證規則
 */
const validateRegister = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('使用者名稱長度必須在 3-20 字符之間')
        .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
        .withMessage('使用者名稱只能包含中文、英文、數字和底線'),
    
    body('email')
        .trim()
        .isEmail()
        .withMessage('請輸入有效的電子信箱格式')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('電子信箱長度不能超過 100 字符'),
    
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('密碼長度必須在 6-128 字符之間')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密碼必須包含至少一個大寫字母、一個小寫字母和一個數字'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('確認密碼與密碼不一致');
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * 使用者登入驗證規則
 */
const validateLogin = [
    body('loginField')
        .trim()
        .notEmpty()
        .withMessage('請輸入使用者名稱或電子信箱')
        .isLength({ min: 3, max: 100 })
        .withMessage('登入欄位長度必須在 3-100 字符之間'),
    
    body('password')
        .notEmpty()
        .withMessage('請輸入密碼')
        .isLength({ min: 1, max: 128 })
        .withMessage('密碼長度不能超過 128 字符'),

    handleValidationErrors
];

/**
 * 記帳記錄驗證規則
 */
const validateExpense = [
    body('amount')
        .isFloat({ min: 0.01, max: 9999999.99 })
        .withMessage('金額必須是大於 0.01 且小於 9,999,999.99 的數字'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('描述長度不能超過 500 字符'),
    
    body('category_id')
        .isInt({ min: 1 })
        .withMessage('分類 ID 必須是正整數'),
    
    body('transaction_date')
        .isISO8601()
        .withMessage('交易日期必須是有效的日期格式 (YYYY-MM-DD)')
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            
            if (date > now) {
                throw new Error('交易日期不能是未來的日期');
            }
            
            if (date < oneYearAgo) {
                throw new Error('交易日期不能超過一年前');
            }
            
            return true;
        }),

    handleValidationErrors
];

/**
 * 分類建立驗證規則
 */
const validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('分類名稱長度必須在 1-50 字符之間')
        .matches(/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_]+$/)
        .withMessage('分類名稱只能包含中文、英文、數字、空格、連字符和底線'),
    
    body('type')
        .isIn(['income', 'expense'])
        .withMessage('分類類型必須是 income（收入）或 expense（支出）'),
    
    body('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('顏色必須是有效的 hex 格式 (例如: #007bff)'),

    handleValidationErrors
];

/**
 * 分頁參數驗證規則
 */
const validatePagination = [
    body('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('頁碼必須是 1-1000 之間的整數'),
    
    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('每頁資料量必須是 1-100 之間的整數'),

    handleValidationErrors
];

/**
 * 日期範圍查詢驗證規則
 */
const validateDateRange = [
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('開始日期必須是有效的日期格式 (YYYY-MM-DD)'),
    
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('結束日期必須是有效的日期格式 (YYYY-MM-DD)')
        .custom((value, { req }) => {
            if (req.body.startDate && value) {
                const start = new Date(req.body.startDate);
                const end = new Date(value);
                
                if (end < start) {
                    throw new Error('結束日期不能早於開始日期');
                }
                
                // 限制查詢範圍不能超過 2 年
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > 730) {
                    throw new Error('日期範圍不能超過 2 年');
                }
            }
            
            return true;
        }),

    handleValidationErrors
];

/**
 * 清理和標準化輸入資料
 */
const sanitizeInput = (req, res, next) => {
    // 移除所有字符串欄位的前後空白
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) {
        sanitizeObject(req.body);
    }

    next();
};

module.exports = {
    handleValidationErrors,
    validateRegister,
    validateLogin,
    validateExpense,
    validateCategory,
    validatePagination,
    validateDateRange,
    sanitizeInput
}; 