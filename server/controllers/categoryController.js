const Category = require('../models/Category');
const { logInfo, logError, logWarn } = require('../utils/logger');

/**
 * 獲取使用者的所有分類
 * GET /api/categories
 */
const getCategories = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query; // 'income', 'expense', 或 undefined（全部）

        const categories = await Category.findByUser(userId, type);

        res.json({
            success: true,
            message: '分類列表獲取成功',
            data: {
                categories: categories.map(category => category.toJSON()),
                total: categories.length
            }
        });

    } catch (error) {
        logError('獲取分類列表失敗:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取分類失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 獲取單一分類詳細資訊
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const userId = req.user.id;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                error: '分類不存在',
                message: '找不到指定的分類'
            });
        }

        // 檢查分類是否屬於當前使用者
        if (category.user_id !== userId) {
            logWarn('使用者嘗試存取他人的分類', {
                userId,
                categoryId,
                categoryOwnerId: category.user_id,
                ip: req.ip
            });

            return res.status(403).json({
                error: '存取被拒絕',
                message: '您沒有權限查看此分類'
            });
        }

        res.json({
            success: true,
            message: '分類資訊獲取成功',
            data: {
                category: category.toJSON()
            }
        });

    } catch (error) {
        logError('獲取分類詳細資訊失敗:', {
            error: error.message,
            categoryId: req.params.id,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取分類失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 建立新分類
 * POST /api/categories
 */
const createCategory = async (req, res) => {
    try {
        const { name, type, color } = req.body;
        const userId = req.user.id;

        const newCategory = await Category.create({
            user_id: userId,
            name,
            type,
            color
        });

        logInfo('使用者建立新分類', {
            userId,
            categoryId: newCategory.id,
            name,
            type,
            ip: req.ip
        });

        res.status(201).json({
            success: true,
            message: '分類建立成功',
            data: {
                category: newCategory.toJSON()
            }
        });

    } catch (error) {
        // 檢查是否為業務邏輯錯誤
        if (error.message.includes('已存在')) {
            logWarn('建立分類失敗 - 重複名稱', {
                error: error.message,
                requestData: req.body,
                userId: req.user?.id,
                ip: req.ip
            });

            return res.status(409).json({
                error: '分類建立失敗',
                message: error.message
            });
        }

        logError('建立分類失敗:', {
            error: error.message,
            requestData: req.body,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '分類建立失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 更新分類
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const userId = req.user.id;
        const { name, color } = req.body;

        // 檢查分類是否存在且屬於當前使用者
        const existingCategory = await Category.findById(categoryId);
        
        if (!existingCategory) {
            return res.status(404).json({
                error: '分類不存在',
                message: '找不到指定的分類'
            });
        }

        if (existingCategory.user_id !== userId) {
            logWarn('使用者嘗試修改他人的分類', {
                userId,
                categoryId,
                categoryOwnerId: existingCategory.user_id,
                ip: req.ip
            });

            return res.status(403).json({
                error: '存取被拒絕',
                message: '您沒有權限修改此分類'
            });
        }

        // 如果要更新名稱，檢查是否與其他分類重複
        if (name && name !== existingCategory.name) {
            const duplicateCategory = await Category.findByUserAndName(userId, name, existingCategory.type);
            if (duplicateCategory) {
                return res.status(409).json({
                    error: '更新失敗',
                    message: `此${existingCategory.type === 'income' ? '收入' : '支出'}分類名稱已存在`
                });
            }
        }

        const updatedCategory = await Category.update(categoryId, { name, color });

        logInfo('使用者更新分類', {
            userId,
            categoryId,
            updateData: { name, color },
            ip: req.ip
        });

        res.json({
            success: true,
            message: '分類更新成功',
            data: {
                category: updatedCategory.toJSON()
            }
        });

    } catch (error) {
        logError('更新分類失敗:', {
            error: error.message,
            categoryId: req.params.id,
            updateData: req.body,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '更新分類失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 刪除分類
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const userId = req.user.id;

        // 檢查分類是否存在且屬於當前使用者
        const existingCategory = await Category.findById(categoryId);
        
        if (!existingCategory) {
            return res.status(404).json({
                error: '分類不存在',
                message: '找不到指定的分類'
            });
        }

        if (existingCategory.user_id !== userId) {
            logWarn('使用者嘗試刪除他人的分類', {
                userId,
                categoryId,
                categoryOwnerId: existingCategory.user_id,
                ip: req.ip
            });

            return res.status(403).json({
                error: '存取被拒絕',
                message: '您沒有權限刪除此分類'
            });
        }

        const success = await Category.delete(categoryId);

        if (!success) {
            return res.status(400).json({
                error: '刪除失敗',
                message: '分類刪除失敗，請稍後再試'
            });
        }

        logInfo('使用者刪除分類', {
            userId,
            categoryId,
            categoryName: existingCategory.name,
            ip: req.ip
        });

        res.json({
            success: true,
            message: '分類刪除成功'
        });

    } catch (error) {
        // 檢查是否為業務邏輯錯誤
        if (error.message.includes('還有') && error.message.includes('筆交易記錄')) {
            return res.status(409).json({
                error: '無法刪除',
                message: error.message
            });
        }

        logError('刪除分類失敗:', {
            error: error.message,
            categoryId: req.params.id,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '刪除分類失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 為使用者建立預設分類
 * POST /api/categories/init-defaults
 */
const initDefaultCategories = async (req, res) => {
    try {
        const userId = req.user.id;

        const createdCategories = await Category.createDefaultCategories(userId);

        logInfo('使用者初始化預設分類', {
            userId,
            createdCount: createdCategories.length,
            ip: req.ip
        });

        res.status(201).json({
            success: true,
            message: `成功建立 ${createdCategories.length} 個預設分類`,
            data: {
                categories: createdCategories.map(category => category.toJSON()),
                total: createdCategories.length
            }
        });

    } catch (error) {
        logError('初始化預設分類失敗:', {
            error: error.message,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '初始化預設分類失敗',
            message: '伺服器內部錯誤'
        });
    }
};

/**
 * 獲取分類的使用統計
 * GET /api/categories/:id/stats
 */
const getCategoryStats = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const userId = req.user.id;

        // 檢查分類是否存在且屬於當前使用者
        const category = await Category.findById(categoryId);
        
        if (!category) {
            return res.status(404).json({
                error: '分類不存在',
                message: '找不到指定的分類'
            });
        }

        if (category.user_id !== userId) {
            return res.status(403).json({
                error: '存取被拒絕',
                message: '您沒有權限查看此分類的統計資料'
            });
        }

        const expenseCount = await Category.getExpenseCount(categoryId);

        res.json({
            success: true,
            message: '分類統計資料獲取成功',
            data: {
                category: category.toJSON(),
                statistics: {
                    totalTransactions: expenseCount,
                    canDelete: expenseCount === 0
                }
            }
        });

    } catch (error) {
        logError('獲取分類統計資料失敗:', {
            error: error.message,
            categoryId: req.params.id,
            userId: req.user?.id,
            ip: req.ip
        });

        res.status(500).json({
            error: '獲取統計資料失敗',
            message: '伺服器內部錯誤'
        });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    initDefaultCategories,
    getCategoryStats
}; 