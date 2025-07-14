const { executeQuery } = require('../config/database');
const { logError, logInfo } = require('../utils/logger');
const Category = require('./Category');

class Expense {
    constructor(expenseData) {
        this.id = expenseData.id;
        this.user_id = expenseData.user_id;
        this.category_id = expenseData.category_id;
        this.amount = parseFloat(expenseData.amount);
        this.description = expenseData.description;
        this.transaction_date = expenseData.transaction_date;
        this.created_at = expenseData.created_at;
        this.updated_at = expenseData.updated_at;
        
        // 如果查詢時包含分類資訊
        if (expenseData.category_name) {
            this.category = {
                id: expenseData.category_id,
                name: expenseData.category_name,
                type: expenseData.category_type,
                color: expenseData.category_color
            };
        }
    }

    /**
     * 建立新記帳記錄
     * @param {Object} expenseData 記帳資料 {user_id, category_id, amount, description, transaction_date}
     * @returns {Promise<Expense>} 新建立的記帳記錄物件
     */
    static async create(expenseData) {
        try {
            const { user_id, category_id, amount, description, transaction_date } = expenseData;

            // 驗證分類是否屬於該使用者
            const belongsToUser = await Category.belongsToUser(category_id, user_id);
            if (!belongsToUser) {
                throw new Error('分類不存在或不屬於此使用者');
            }

            const query = `
                INSERT INTO expenses (user_id, category_id, amount, description, transaction_date)
                VALUES (?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                user_id, 
                category_id, 
                amount, 
                description || null, 
                transaction_date
            ]);
            
            logInfo('新記帳記錄建立成功', { 
                expenseId: result.insertId, 
                userId: user_id,
                categoryId: category_id,
                amount,
                transaction_date
            });

            return await this.findById(result.insertId);

        } catch (error) {
            logError('記帳記錄建立失敗:', { 
                error: error.message, 
                expenseData 
            });
            throw error;
        }
    }

    /**
     * 根據 ID 查找記帳記錄（包含分類資訊）
     * @param {number} id 記帳記錄 ID
     * @returns {Promise<Expense|null>} 記帳記錄物件或 null
     */
    static async findById(id) {
        try {
            const query = `
                SELECT e.*, c.name as category_name, c.type as category_type, c.color as category_color
                FROM expenses e
                JOIN categories c ON e.category_id = c.id
                WHERE e.id = ?
            `;
            const results = await executeQuery(query, [id]);
            
            return results.length > 0 ? new Expense(results[0]) : null;
        } catch (error) {
            logError('根據 ID 查找記帳記錄失敗:', { id, error: error.message });
            throw error;
        }
    }

    /**
     * 根據使用者 ID 查找記帳記錄
     * @param {number} userId 使用者 ID
     * @param {Object} options 查詢選項 {page, limit, startDate, endDate, categoryId, type}
     * @returns {Promise<Object>} 包含記錄和分頁資訊的物件
     */
    static async findByUser(userId, options = {}) {
        try {
            console.log('🔍 Expense.findByUser 開始執行');
            console.log('🔍 原始參數:', { userId, options });
            
            const {
                page = 1,
                limit = 20,
                startDate,
                endDate,
                categoryId,
                type // 'income' 或 'expense'
            } = options;

            console.log('🔍 解構後的參數:', { page, limit, startDate, endDate, categoryId, type });
            console.log('🔍 參數類型:', { 
                page: typeof page, 
                limit: typeof limit, 
                userId: typeof userId,
                categoryId: typeof categoryId 
            });

            // 建立基本查詢
            let query = `
                SELECT e.*, c.name as category_name, c.type as category_type, c.color as category_color
                FROM expenses e
                JOIN categories c ON e.category_id = c.id
                WHERE e.user_id = ?
            `;
            const params = [userId];
            console.log('🔍 初始查詢:', query.trim());
            console.log('🔍 初始參數:', params);

            // 添加篩選條件
            if (startDate) {
                query += ' AND e.transaction_date >= ?';
                params.push(startDate);
                console.log('🔍 添加 startDate 條件:', startDate);
            }

            if (endDate) {
                query += ' AND e.transaction_date <= ?';
                params.push(endDate);
                console.log('🔍 添加 endDate 條件:', endDate);
            }

            if (categoryId) {
                query += ' AND e.category_id = ?';
                params.push(categoryId);
                console.log('🔍 添加 categoryId 條件:', categoryId);
            }

            if (type) {
                query += ' AND c.type = ?';
                params.push(type);
                console.log('🔍 添加 type 條件:', type);
            }

            console.log('🔍 篩選條件添加後的查詢:', query.trim());
            console.log('🔍 篩選條件添加後的參數:', params);

            // 計算總數（用於分頁）
            let countQuery = `
                SELECT COUNT(*) as total
                FROM expenses e
                JOIN categories c ON e.category_id = c.id
                WHERE e.user_id = ?
            `;
            const countParams = [userId];

            // 添加相同的篩選條件到計數查詢
            if (startDate) {
                countQuery += ' AND e.transaction_date >= ?';
                countParams.push(startDate);
            }

            if (endDate) {
                countQuery += ' AND e.transaction_date <= ?';
                countParams.push(endDate);
            }

            if (categoryId) {
                countQuery += ' AND e.category_id = ?';
                countParams.push(categoryId);
            }

            if (type) {
                countQuery += ' AND c.type = ?';
                countParams.push(type);
            }

            console.log('🔍 執行計數查詢:', countQuery.trim());
            console.log('🔍 計數查詢參數:', countParams);
            
            const [countResult] = await executeQuery(countQuery, countParams);
            const total = countResult.total;
            console.log('🔍 查詢到的總數:', total);

            // 添加排序和分頁
            query += ' ORDER BY e.transaction_date DESC, e.created_at DESC';
            query += ' LIMIT ? OFFSET ?';
            
            const parsedPage = parseInt(page);
            const parsedLimit = parseInt(limit);
            const offset = (parsedPage - 1) * parsedLimit;
            
            console.log('🔍 分頁計算:', {
                originalPage: page,
                originalLimit: limit,
                parsedPage,
                parsedLimit,
                offset
            });
            
            // mysql2 的 execute 方法需要 String 類型的 LIMIT 和 OFFSET
            params.push(parsedLimit.toString(), offset.toString());

            console.log('🔍 最終查詢:', query.trim());
            console.log('🔍 最終參數:', params);
            console.log('🔍 參數詳細資訊:', {
                userId: params[0],
                limit: params[params.length - 2],
                offset: params[params.length - 1],
                '參數總數': params.length,
                '查詢中的?數量': (query.match(/\?/g) || []).length
            });

            const results = await executeQuery(query, params);
            console.log('🔍 查詢結果數量:', results.length);
            const expenses = results.map(expense => new Expense(expense));

            return {
                expenses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page * limit < total
                }
            };

        } catch (error) {
            console.error('❌ Expense.findByUser 發生錯誤:', error);
            console.error('❌ 錯誤詳細信息:', {
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState,
                sql: error.sql
            });
            logError('根據使用者查找記帳記錄失敗:', { userId, options, error: error.message });
            throw error;
        }
    }

    /**
     * 更新記帳記錄
     * @param {number} id 記帳記錄 ID
     * @param {Object} updateData 要更新的資料
     * @param {number} userId 使用者 ID（用於權限檢查）
     * @returns {Promise<Expense|null>} 更新後的記帳記錄物件
     */
    static async update(id, updateData, userId) {
        try {
            // 先檢查記錄是否存在且屬於該使用者
            const existingExpense = await this.findById(id);
            if (!existingExpense || existingExpense.user_id !== userId) {
                throw new Error('記帳記錄不存在或無權限修改');
            }

            const { category_id, amount, description, transaction_date } = updateData;
            const updates = [];
            const params = [];

            if (category_id !== undefined) {
                // 檢查新分類是否屬於該使用者
                const belongsToUser = await Category.belongsToUser(category_id, userId);
                if (!belongsToUser) {
                    throw new Error('分類不存在或不屬於此使用者');
                }
                updates.push('category_id = ?');
                params.push(category_id);
            }

            if (amount !== undefined) {
                updates.push('amount = ?');
                params.push(amount);
            }

            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description || null);
            }

            if (transaction_date !== undefined) {
                updates.push('transaction_date = ?');
                params.push(transaction_date);
            }

            if (updates.length === 0) {
                throw new Error('沒有提供要更新的資料');
            }

            // 添加更新時間
            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            const query = `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`;
            await executeQuery(query, params);

            logInfo('記帳記錄更新成功', { expenseId: id, updateData, userId });

            return await this.findById(id);

        } catch (error) {
            logError('記帳記錄更新失敗:', { id, updateData, userId, error: error.message });
            throw error;
        }
    }

    /**
     * 刪除記帳記錄
     * @param {number} id 記帳記錄 ID
     * @param {number} userId 使用者 ID（用於權限檢查）
     * @returns {Promise<boolean>} 是否刪除成功
     */
    static async delete(id, userId) {
        try {
            // 先檢查記錄是否存在且屬於該使用者
            const query = 'SELECT user_id FROM expenses WHERE id = ?';
            const results = await executeQuery(query, [id]);
            
            if (results.length === 0) {
                throw new Error('記帳記錄不存在');
            }

            if (results[0].user_id !== userId) {
                throw new Error('無權限刪除此記錄');
            }

            const deleteQuery = 'DELETE FROM expenses WHERE id = ?';
            const result = await executeQuery(deleteQuery, [id]);

            const success = result.affectedRows > 0;
            
            if (success) {
                logInfo('記帳記錄刪除成功', { expenseId: id, userId });
            }

            return success;

        } catch (error) {
            logError('記帳記錄刪除失敗:', { id, userId, error: error.message });
            throw error;
        }
    }

    /**
     * 獲取使用者的統計資料
     * @param {number} userId 使用者 ID
     * @param {Object} options 查詢選項 {startDate, endDate, groupBy}
     * @returns {Promise<Object>} 統計資料
     */
    static async getStatistics(userId, options = {}) {
        try {
            const { startDate, endDate, groupBy = 'month' } = options;

            let dateCondition = '';
            const params = [userId];

            if (startDate || endDate) {
                const conditions = [];
                if (startDate) {
                    conditions.push('e.transaction_date >= ?');
                    params.push(startDate);
                }
                if (endDate) {
                    conditions.push('e.transaction_date <= ?');
                    params.push(endDate);
                }
                dateCondition = ` AND ${conditions.join(' AND ')}`;
            }

            // 總收入和支出
            const summaryQuery = `
                SELECT 
                    c.type,
                    SUM(e.amount) as total,
                    COUNT(e.id) as count
                FROM expenses e
                JOIN categories c ON e.category_id = c.id
                WHERE e.user_id = ?${dateCondition}
                GROUP BY c.type
            `;

            const summaryResults = await executeQuery(summaryQuery, params);
            
            const summary = {
                income: { total: 0, count: 0 },
                expense: { total: 0, count: 0 },
                balance: 0
            };

            summaryResults.forEach(row => {
                summary[row.type] = {
                    total: parseFloat(row.total),
                    count: parseInt(row.count)
                };
            });

            summary.balance = summary.income.total - summary.expense.total;

            // 分類統計
            const categoryQuery = `
                SELECT 
                    c.id,
                    c.name,
                    c.type,
                    c.color,
                    SUM(e.amount) as total,
                    COUNT(e.id) as count
                FROM expenses e
                JOIN categories c ON e.category_id = c.id
                WHERE e.user_id = ?${dateCondition}
                GROUP BY c.id, c.name, c.type, c.color
                ORDER BY total DESC
            `;

            const categoryResults = await executeQuery(categoryQuery, params);

            // 時間序列統計（按月或按日）
            let timeSeriesQuery;
            if (groupBy === 'day') {
                timeSeriesQuery = `
                    SELECT 
                        DATE(e.transaction_date) as date,
                        c.type,
                        SUM(e.amount) as total
                    FROM expenses e
                    JOIN categories c ON e.category_id = c.id
                    WHERE e.user_id = ?${dateCondition}
                    GROUP BY DATE(e.transaction_date), c.type
                    ORDER BY date DESC
                `;
            } else {
                timeSeriesQuery = `
                    SELECT 
                        YEAR(e.transaction_date) as year,
                        MONTH(e.transaction_date) as month,
                        c.type,
                        SUM(e.amount) as total
                    FROM expenses e
                    JOIN categories c ON e.category_id = c.id
                    WHERE e.user_id = ?${dateCondition}
                    GROUP BY YEAR(e.transaction_date), MONTH(e.transaction_date), c.type
                    ORDER BY year DESC, month DESC
                `;
            }

            const timeSeriesResults = await executeQuery(timeSeriesQuery, params);

            return {
                summary,
                categoryBreakdown: categoryResults.map(row => ({
                    category: {
                        id: row.id,
                        name: row.name,
                        type: row.type,
                        color: row.color
                    },
                    total: parseFloat(row.total),
                    count: parseInt(row.count)
                })),
                timeSeries: timeSeriesResults.map(row => {
                    if (groupBy === 'day') {
                        return {
                            date: row.date,
                            type: row.type,
                            total: parseFloat(row.total)
                        };
                    } else {
                        return {
                            year: row.year,
                            month: row.month,
                            type: row.type,
                            total: parseFloat(row.total)
                        };
                    }
                })
            };

        } catch (error) {
            logError('獲取統計資料失敗:', { userId, options, error: error.message });
            throw error;
        }
    }

    /**
     * 檢查記帳記錄是否屬於指定使用者
     * @param {number} expenseId 記帳記錄 ID
     * @param {number} userId 使用者 ID
     * @returns {Promise<boolean>} 是否為該使用者的記錄
     */
    static async belongsToUser(expenseId, userId) {
        try {
            const query = 'SELECT id FROM expenses WHERE id = ? AND user_id = ?';
            const results = await executeQuery(query, [expenseId, userId]);
            return results.length > 0;

        } catch (error) {
            logError('檢查記帳記錄所有權失敗:', { expenseId, userId, error: error.message });
            throw error;
        }
    }

    /**
     * 將記帳記錄物件轉為 JSON
     * @returns {Object} 記帳記錄資料
     */
    toJSON() {
        const baseData = {
            id: this.id,
            user_id: this.user_id,
            category_id: this.category_id,
            amount: this.amount,
            description: this.description,
            transaction_date: this.transaction_date,
            date: this.transaction_date, // 添加前端期望的 date 欄位
            created_at: this.created_at,
            updated_at: this.updated_at
        };

        // 如果有分類資訊，將其展開到根層級
        if (this.category) {
            baseData.category_name = this.category.name;
            baseData.category_type = this.category.type;
            baseData.category_color = this.category.color;
            baseData.type = this.category.type; // 添加前端期望的 type 欄位
            baseData.category = this.category; // 保留原始 category 物件
        }

        return baseData;
    }
}

module.exports = Expense; 