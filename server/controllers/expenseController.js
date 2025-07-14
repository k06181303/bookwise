const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { logInfo, logError, logWarn } = require('../utils/logger');

/**
 * 獲取使用者的記帳記錄列表
 * GET /api/expenses
 */
const getExpenses = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 20,
            startDate,
            endDate,
            categoryId,
            type
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100), // 限制最大每頁 100 筆
            startDate,
            endDate,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            type
        };

        console.log('🔍 調用 Expense.findByUser 前的參數:');
        console.log('userId:', userId, typeof userId);
        console.log('options:', options);
        console.log('page:', options.page, typeof options.page);
        console.log('limit:', options.limit, typeof options.limit);

        const result = await Expense.findByUser(userId, options);

        res.json({
            success: true,
            message: '記帳記錄列表獲取成功',
            data: {
                expenses: result.expenses.map(expense => expense.toJSON()),
                pagination: result.pagination
            }
        });

    } catch (error) {
        console.error('❌ 獲取記帳記錄列表失敗:', error);
        console.error('❌ 錯誤堆疊:', error.stack);
        console.error('❌ 用戶ID:', req.user?.id);
        console.error('❌ 查詢參數:', req.query);
        
        logError('獲取記帳記錄列表失敗:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            query: req.query,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取記帳記錄失敗',
            message: '伺服器內部錯誤',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 獲取單一記帳記錄詳細資訊
 * GET /api/expenses/:id
 */
const getExpenseById = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);
        const userId = req.user.id;

        const expense = await Expense.findById(expenseId);

        if (!expense) {
            return res.status(404).json({
                error: '記帳記錄不存在',
                message: '找不到指定的記帳記錄'
            });
        }

        // 檢查記錄是否屬於當前使用者
        if (expense.user_id !== userId) {
            logWarn('使用者嘗試存取他人的記帳記錄', {
                userId,
                expenseId,
                expenseOwnerId: expense.user_id,
                ip: req.ip
            });

            return res.status(403).json({
                error: '存取被拒絕',
                message: '您沒有權限查看此記帳記錄'
            });
        }

        res.json({
            success: true,
            message: '記帳記錄詳細資訊獲取成功',
            data: {
                expense: expense.toJSON()
            }
        });

    } catch (error) {
        logError('獲取記帳記錄詳細資訊失敗:', {
            error: error.message,
            expenseId: req.params.id,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取記帳記錄失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 建立新記帳記錄
 * POST /api/expenses
 */
const createExpense = async (req, res) => {
    try {
        const { category_id, amount, description, transaction_date } = req.body;
        const userId = req.user.id;

        const newExpense = await Expense.create({
            user_id: userId,
            category_id,
            amount,
            description,
            transaction_date
        });

        logInfo('使用者建立新記帳記錄', {
            userId,
            expenseId: newExpense.id,
            categoryId: category_id,
            amount,
            transaction_date,
            ip: req.ip
        });

        res.status(201).json({
            success: true,
            message: '記帳記錄建立成功',
            data: {
                expense: newExpense.toJSON()
            }
        });

    } catch (error) {
        // 檢查是否為業務邏輯錯誤
        if (error.message.includes('不存在') || error.message.includes('不屬於')) {
            logWarn('建立記帳記錄失敗 - 分類無效', {
                error: error.message,
                requestData: req.body,
                userId: req.user?.id,
                ip: req.ip
            });

            return res.status(400).json({
                error: '記帳記錄建立失敗',
                message: error.message
            });
        }

        logError('建立記帳記錄失敗:', {
            error: error.message,
            requestData: req.body,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '記帳記錄建立失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 更新記帳記錄
 * PUT /api/expenses/:id
 */
const updateExpense = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);
        const userId = req.user.id;
        const { category_id, amount, description, transaction_date } = req.body;

        const updatedExpense = await Expense.update(expenseId, {
            category_id,
            amount,
            description,
            transaction_date
        }, userId);

        if (!updatedExpense) {
            return res.status(404).json({
                error: '更新失敗',
                message: '找不到指定的記帳記錄'
            });
        }

        logInfo('使用者更新記帳記錄', {
            userId,
            expenseId,
            updateData: { category_id, amount, description, transaction_date },
            ip: req.ip
        });

        res.json({
            success: true,
            message: '記帳記錄更新成功',
            data: {
                expense: updatedExpense.toJSON()
            }
        });

    } catch (error) {
        // 檢查是否為業務邏輯錯誤
        if (error.message.includes('不存在') || error.message.includes('無權限') || error.message.includes('不屬於')) {
            const statusCode = error.message.includes('無權限') ? 403 : 400;
            
            logWarn('更新記帳記錄失敗 - 權限或資料問題', {
                error: error.message,
                expenseId: req.params.id,
                updateData: req.body,
                userId: req.user?.id,
                ip: req.ip
            });

            return res.status(statusCode).json({
                error: '更新失敗',
                message: error.message
            });
        }

        logError('更新記帳記錄失敗:', {
            error: error.message,
            expenseId: req.params.id,
            updateData: req.body,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '更新記帳記錄失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 刪除記帳記錄
 * DELETE /api/expenses/:id
 */
const deleteExpense = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);
        const userId = req.user.id;

        const success = await Expense.delete(expenseId, userId);

        if (!success) {
            return res.status(400).json({
                error: '刪除失敗',
                message: '記帳記錄刪除失敗，請稍後再試'
            });
        }

        logInfo('使用者刪除記帳記錄', {
            userId,
            expenseId,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '記帳記錄刪除成功'
        });

    } catch (error) {
        // 檢查是否為業務邏輯錯誤
        if (error.message.includes('不存在') || error.message.includes('無權限')) {
            const statusCode = error.message.includes('無權限') ? 403 : 404;
            
            return res.status(statusCode).json({
                error: '刪除失敗',
                message: error.message
            });
        }

        logError('刪除記帳記錄失敗:', {
            error: error.message,
            expenseId: req.params.id,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '刪除記帳記錄失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 獲取使用者的統計資料
 * GET /api/expenses/statistics
 */
const getStatistics = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            startDate,
            endDate,
            groupBy = 'month'
        } = req.query;

        const statistics = await Expense.getStatistics(userId, {
            startDate,
            endDate,
            groupBy
        });

        res.json({
            success: true,
            message: '統計資料獲取成功',
            data: statistics
        });

    } catch (error) {
        console.error('❌ 獲取統計資料失敗:', error);
        console.error('❌ 錯誤堆疊:', error.stack);
        console.error('❌ 用戶ID:', req.user?.id);
        console.error('❌ 查詢參數:', req.query);
        
        logError('獲取統計資料失敗:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            query: req.query,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取統計資料失敗',
            message: '伺服器內部錯誤',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 快速記帳 - 使用預設設定建立記錄（支持智能分類）
 * POST /api/expenses/quick
 */
const quickExpense = async (req, res) => {
    try {
        const { amount, categoryName, type, description } = req.body;
        const userId = req.user.id;

        // 導入智能分類判斷工具
        const { classifyCategory, getSuggestedType, getRecommendedColor } = require('../utils/categoryClassifier');

        let finalType = type;
        let isAutoClassified = false;

        // 如果沒有提供類型，嘗試自動判斷
        if (!type) {
            const suggestion = getSuggestedType(categoryName);
            if (suggestion.type) {
                finalType = suggestion.type;
                isAutoClassified = true;
                logInfo('智能分類判斷', {
                    userId,
                    categoryName,
                    suggestedType: suggestion.type,
                    confidence: suggestion.confidence,
                    reason: suggestion.reason
                });
            } else {
                // 無法判斷類型，預設為支出
                finalType = 'expense';
                isAutoClassified = true;
                logWarn('無法判斷分類類型，預設為支出', {
                    userId,
                    categoryName,
                    reason: suggestion.reason
                });
            }
        }

        // 查找或建立分類
        let category = await Category.findByUserAndName(userId, categoryName, finalType);
        
        if (!category) {
            // 如果分類不存在，建立新分類
            const recommendedColor = getRecommendedColor(finalType, categoryName);
            
            category = await Category.create({
                user_id: userId,
                name: categoryName,
                type: finalType,
                color: recommendedColor
            });
        }

        // 建立記帳記錄
        const newExpense = await Expense.create({
            user_id: userId,
            category_id: category.id,
            amount,
            description,
            transaction_date: new Date().toISOString().split('T')[0] // 今天的日期
        });

        logInfo('使用者快速記帳', {
            userId,
            expenseId: newExpense.id,
            categoryId: category.id,
            categoryName,
            amount,
            finalType,
            isAutoClassified,
            ip: req.ip
        });

        res.status(201).json({
            success: true,
            message: isAutoClassified ? 
                `快速記帳成功，已自動判斷為${finalType === 'income' ? '收入' : '支出'}類別` : 
                '快速記帳成功',
            data: {
                expense: newExpense.toJSON(),
                category: category.toJSON(),
                classification: {
                    isAutoClassified,
                    type: finalType,
                    categoryName
                }
            }
        });

    } catch (error) {
        logError('快速記帳失敗:', {
            error: error.message,
            requestData: req.body,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '快速記帳失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 批量導入記帳記錄
 * POST /api/expenses/bulk-import
 */
const bulkImport = async (req, res) => {
    try {
        const { expenses } = req.body; // 陣列格式的記帳記錄
        const userId = req.user.id;

        if (!Array.isArray(expenses) || expenses.length === 0) {
            return res.status(400).json({
                error: '批量導入失敗',
                message: '請提供有效的記帳記錄陣列'
            });
        }

        if (expenses.length > 100) {
            return res.status(400).json({
                error: '批量導入失敗',
                message: '單次最多只能導入 100 筆記錄'
            });
        }

        const results = {
            success: [],
            failed: []
        };

        for (let i = 0; i < expenses.length; i++) {
            try {
                const expenseData = expenses[i];
                const newExpense = await Expense.create({
                    user_id: userId,
                    ...expenseData
                });

                results.success.push({
                    index: i,
                    expense: newExpense.toJSON()
                });

            } catch (error) {
                results.failed.push({
                    index: i,
                    data: expenses[i],
                    error: error.message
                });
            }
        }

        logInfo('使用者批量導入記帳記錄', {
            userId,
            totalAttempted: expenses.length,
            successCount: results.success.length,
            failedCount: results.failed.length,
            ip: req.ip
        });

        const statusCode = results.failed.length > 0 ? 207 : 201; // 207 Multi-Status

        res.status(statusCode).json({
            success: results.failed.length === 0,
            message: `批量導入完成，成功 ${results.success.length} 筆，失敗 ${results.failed.length} 筆`,
            data: results
        });

    } catch (error) {
        logError('批量導入記帳記錄失敗:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '批量導入失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 獲取最近的交易記錄（快速存取）
 * GET /api/expenses/recent
 */
const getRecentExpenses = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        const result = await Expense.findByUser(userId, {
            page: 1,
            limit: Math.min(parseInt(limit), 20)
        });

        res.json({
            success: true,
            message: '最近交易記錄獲取成功',
            data: {
                expenses: result.expenses.map(expense => expense.toJSON()),
                total: result.expenses.length
            }
        });

    } catch (error) {
        logError('獲取最近交易記錄失敗:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取交易記錄失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 獲取分類建議
 * POST /api/expenses/classify-suggestion
 */
const getClassifySuggestion = async (req, res) => {
    try {
        const { categoryName } = req.body;
        
        if (!categoryName) {
            return res.status(400).json({
                error: '請提供分類名稱',
                message: '分類名稱不能為空'
            });
        }

        // 導入智能分類判斷工具
        const { getSuggestedType, getRecommendedColor } = require('../utils/categoryClassifier');

        const suggestion = getSuggestedType(categoryName);
        
        res.json({
            success: true,
            message: '分類建議獲取成功',
            data: {
                categoryName,
                suggestion: {
                    type: suggestion.type,
                    confidence: suggestion.confidence,
                    reason: suggestion.reason,
                    recommendedColor: suggestion.type ? getRecommendedColor(suggestion.type, categoryName) : null
                },
                typeText: suggestion.type === 'income' ? '收入' : 
                         suggestion.type === 'expense' ? '支出' : '無法判斷'
            }
        });

    } catch (error) {
        logError('獲取分類建議失敗:', {
            error: error.message,
            requestData: req.body,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取分類建議失敗',
            message: '伺服器內部錯誤'
        });
    }
};

module.exports = {
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
}; 