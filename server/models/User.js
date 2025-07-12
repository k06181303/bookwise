const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { logError, logInfo } = require('../utils/logger');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.username = userData.username;
        this.email = userData.email;
        this.password_hash = userData.password_hash;
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    /**
     * 建立新使用者
     * @param {Object} userData 使用者資料 {username, email, password}
     * @returns {Promise<User>} 新建立的使用者物件
     */
    static async create(userData) {
        try {
            const { username, email, password } = userData;

            // 檢查使用者名稱是否已存在
            const existingUsername = await this.findByUsername(username);
            if (existingUsername) {
                throw new Error('使用者名稱已存在');
            }

            // 檢查信箱是否已存在
            const existingEmail = await this.findByEmail(email);
            if (existingEmail) {
                throw new Error('信箱已被註冊');
            }

            // 加密密碼
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // 插入新使用者到資料庫
            const query = `
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            `;

            const result = await executeQuery(query, [username, email, password_hash]);
            
            logInfo('新使用者註冊成功', { 
                userId: result.insertId, 
                username, 
                email 
            });

            // 回傳新建立的使用者（不含密碼）
            return await this.findById(result.insertId);

        } catch (error) {
            logError('使用者建立失敗:', { 
                error: error.message, 
                userData: { username: userData.username, email: userData.email }
            });
            throw error;
        }
    }

    /**
     * 根據 ID 查找使用者
     * @param {number} id 使用者 ID
     * @returns {Promise<User|null>} 使用者物件或 null
     */
    static async findById(id) {
        try {
            const query = 'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?';
            const results = await executeQuery(query, [id]);
            
            return results.length > 0 ? new User(results[0]) : null;
        } catch (error) {
            logError('根據 ID 查找使用者失敗:', { id, error: error.message });
            throw error;
        }
    }

    /**
     * 根據使用者名稱查找使用者
     * @param {string} username 使用者名稱
     * @returns {Promise<User|null>} 使用者物件或 null
     */
    static async findByUsername(username) {
        try {
            const query = 'SELECT id, username, email, created_at, updated_at FROM users WHERE username = ?';
            const results = await executeQuery(query, [username]);
            
            return results.length > 0 ? new User(results[0]) : null;
        } catch (error) {
            logError('根據使用者名稱查找失敗:', { username, error: error.message });
            throw error;
        }
    }

    /**
     * 根據信箱查找使用者
     * @param {string} email 使用者信箱
     * @returns {Promise<User|null>} 使用者物件或 null
     */
    static async findByEmail(email) {
        try {
            const query = 'SELECT id, username, email, created_at, updated_at FROM users WHERE email = ?';
            const results = await executeQuery(query, [email]);
            
            return results.length > 0 ? new User(results[0]) : null;
        } catch (error) {
            logError('根據信箱查找使用者失敗:', { email, error: error.message });
            throw error;
        }
    }

    /**
     * 驗證登入憑證
     * @param {string} loginField 使用者名稱或信箱
     * @param {string} password 密碼
     * @returns {Promise<User|null>} 驗證成功返回使用者物件，失敗返回 null
     */
    static async validateCredentials(loginField, password) {
        try {
            // 查找使用者（支援使用者名稱或信箱登入）
            const query = `
                SELECT id, username, email, password_hash, created_at, updated_at 
                FROM users 
                WHERE username = ? OR email = ?
            `;
            
            const results = await executeQuery(query, [loginField, loginField]);
            
            if (results.length === 0) {
                return null; // 使用者不存在
            }

            const userData = results[0];
            
            // 驗證密碼
            const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
            
            if (!isPasswordValid) {
                logInfo('登入失敗 - 密碼錯誤', { 
                    loginField, 
                    userId: userData.id 
                });
                return null;
            }

            logInfo('使用者登入成功', { 
                userId: userData.id, 
                username: userData.username 
            });

            // 回傳使用者物件（不含密碼）
            return new User({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                created_at: userData.created_at,
                updated_at: userData.updated_at
            });

        } catch (error) {
            logError('驗證登入憑證失敗:', { 
                loginField, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 更新使用者最後登入時間
     * @param {number} userId 使用者 ID
     */
    static async updateLastLogin(userId) {
        try {
            const query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            await executeQuery(query, [userId]);
        } catch (error) {
            logError('更新最後登入時間失敗:', { userId, error: error.message });
            // 不拋出錯誤，因為這不是關鍵功能
        }
    }

    /**
     * 將使用者物件轉為 JSON（不含敏感資訊）
     * @returns {Object} 安全的使用者資料
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = User; 