const { executeQuery } = require('../config/database');
const { logError, logInfo } = require('../utils/logger');

class Category {
    constructor(categoryData) {
        this.id = categoryData.id;
        this.user_id = categoryData.user_id;
        this.name = categoryData.name;
        this.type = categoryData.type; // 'income' 或 'expense'
        this.color = categoryData.color;
        this.created_at = categoryData.created_at;
    }

    /**
     * 建立新分類
     * @param {Object} categoryData 分類資料 {user_id, name, type, color}
     * @returns {Promise<Category>} 新建立的分類物件
     */
    static async create(categoryData) {
        try {
            const { user_id, name, type, color = '#007bff' } = categoryData;

            // 檢查同一使用者是否已有相同名稱的分類
            const existingCategory = await this.findByUserAndName(user_id, name, type);
            if (existingCategory) {
                throw new Error(`此${type === 'income' ? '收入' : '支出'}分類名稱已存在`);
            }

            const query = `
                INSERT INTO categories (user_id, name, type, color)
                VALUES (?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [user_id, name, type, color]);
            
            logInfo('新分類建立成功', { 
                categoryId: result.insertId, 
                userId: user_id,
                name, 
                type,
                color
            });

            return await this.findById(result.insertId);

        } catch (error) {
            logError('分類建立失敗:', { 
                error: error.message, 
                categoryData 
            });
            throw error;
        }
    }

    /**
     * 根據 ID 查找分類
     * @param {number} id 分類 ID
     * @returns {Promise<Category|null>} 分類物件或 null
     */
    static async findById(id) {
        try {
            const query = 'SELECT * FROM categories WHERE id = ?';
            const results = await executeQuery(query, [id]);
            
            return results.length > 0 ? new Category(results[0]) : null;
        } catch (error) {
            logError('根據 ID 查找分類失敗:', { id, error: error.message });
            throw error;
        }
    }

    /**
     * 根據使用者 ID 查找所有分類
     * @param {number} userId 使用者 ID
     * @param {string} type 分類類型 ('income', 'expense', 或 null 表示全部)
     * @returns {Promise<Category[]>} 分類陣列
     */
    static async findByUser(userId, type = null) {
        try {
            let query = `
                SELECT c.*, 
                       COALESCE(e.usage_count, 0) as usage_count
                FROM categories c
                LEFT JOIN (
                    SELECT category_id, COUNT(*) as usage_count 
                    FROM expenses 
                    GROUP BY category_id
                ) e ON c.id = e.category_id
                WHERE c.user_id = ?
            `;
            const params = [userId];

            if (type) {
                query += ' AND c.type = ?';
                params.push(type);
            }

            query += ' ORDER BY c.name ASC';

            const results = await executeQuery(query, params);
            return results.map(categoryData => {
                const category = new Category(categoryData);
                category.usage_count = parseInt(categoryData.usage_count) || 0;
                return category;
            });

        } catch (error) {
            logError('根據使用者查找分類失敗:', { userId, type, error: error.message });
            throw error;
        }
    }

    /**
     * 根據使用者和分類名稱查找分類
     * @param {number} userId 使用者 ID
     * @param {string} name 分類名稱
     * @param {string} type 分類類型
     * @returns {Promise<Category|null>} 分類物件或 null
     */
    static async findByUserAndName(userId, name, type) {
        try {
            const query = 'SELECT * FROM categories WHERE user_id = ? AND name = ? AND type = ?';
            const results = await executeQuery(query, [userId, name, type]);
            
            return results.length > 0 ? new Category(results[0]) : null;
        } catch (error) {
            logError('根據使用者和名稱查找分類失敗:', { userId, name, type, error: error.message });
            throw error;
        }
    }

    /**
     * 更新分類
     * @param {number} id 分類 ID
     * @param {Object} updateData 要更新的資料
     * @returns {Promise<Category|null>} 更新後的分類物件
     */
    static async update(id, updateData) {
        try {
            const { name, color } = updateData;
            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }

            if (color !== undefined) {
                updates.push('color = ?');
                params.push(color);
            }

            if (updates.length === 0) {
                throw new Error('沒有提供要更新的資料');
            }

            params.push(id);

            const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
            await executeQuery(query, params);

            logInfo('分類更新成功', { categoryId: id, updateData });

            return await this.findById(id);

        } catch (error) {
            logError('分類更新失敗:', { id, updateData, error: error.message });
            throw error;
        }
    }

    /**
     * 刪除分類
     * @param {number} id 分類 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    static async delete(id) {
        try {
            // 先檢查是否有交易記錄使用此分類
            const expenseCount = await this.getExpenseCount(id);
            if (expenseCount > 0) {
                throw new Error(`此分類下還有 ${expenseCount} 筆交易記錄，無法刪除`);
            }

            const query = 'DELETE FROM categories WHERE id = ?';
            const result = await executeQuery(query, [id]);

            const success = result.affectedRows > 0;
            
            if (success) {
                logInfo('分類刪除成功', { categoryId: id });
            }

            return success;

        } catch (error) {
            logError('分類刪除失敗:', { id, error: error.message });
            throw error;
        }
    }

    /**
     * 獲取分類下的交易記錄數量
     * @param {number} categoryId 分類 ID
     * @returns {Promise<number>} 交易記錄數量
     */
    static async getExpenseCount(categoryId) {
        try {
            const query = 'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?';
            const results = await executeQuery(query, [categoryId]);
            return results[0].count;

        } catch (error) {
            logError('查詢分類交易記錄數量失敗:', { categoryId, error: error.message });
            throw error;
        }
    }

    /**
     * 檢查分類是否屬於指定使用者
     * @param {number} categoryId 分類 ID
     * @param {number} userId 使用者 ID
     * @returns {Promise<boolean>} 是否為該使用者的分類
     */
    static async belongsToUser(categoryId, userId) {
        try {
            const query = 'SELECT id FROM categories WHERE id = ? AND user_id = ?';
            const results = await executeQuery(query, [categoryId, userId]);
            return results.length > 0;

        } catch (error) {
            logError('檢查分類所有權失敗:', { categoryId, userId, error: error.message });
            throw error;
        }
    }

    /**
     * 為新使用者建立預設分類
     * @param {number} userId 使用者 ID
     * @returns {Promise<Category[]>} 建立的預設分類
     */
    static async createDefaultCategories(userId) {
        try {
            const defaultCategories = [
                // 收入分類
                { name: '薪資', type: 'income', color: '#28a745' },
                { name: '投資收益', type: 'income', color: '#17a2b8' },
                { name: '其他收入', type: 'income', color: '#6c757d' },
                
                // 支出分類
                { name: '餐飲', type: 'expense', color: '#fd7e14' },
                { name: '交通', type: 'expense', color: '#6f42c1' },
                { name: '購物', type: 'expense', color: '#e83e8c' },
                { name: '娛樂', type: 'expense', color: '#20c997' },
                { name: '醫療', type: 'expense', color: '#dc3545' },
                { name: '居住', type: 'expense', color: '#6c757d' },
                { name: '其他支出', type: 'expense', color: '#343a40' }
            ];

            const createdCategories = [];

            for (const categoryData of defaultCategories) {
                try {
                    const category = await this.create({
                        user_id: userId,
                        ...categoryData
                    });
                    createdCategories.push(category);
                } catch (error) {
                    // 如果分類已存在，跳過但不報錯
                    if (!error.message.includes('已存在')) {
                        throw error;
                    }
                }
            }

            logInfo('預設分類建立完成', { 
                userId, 
                createdCount: createdCategories.length 
            });

            return createdCategories;

        } catch (error) {
            logError('建立預設分類失敗:', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * 將分類物件轉為 JSON
     * @returns {Object} 分類資料
     */
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            name: this.name,
            type: this.type,
            color: this.color,
            created_at: this.created_at,
            usage_count: this.usage_count || 0
        };
    }
}

module.exports = Category; 