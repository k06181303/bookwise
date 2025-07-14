const mysql = require('mysql2/promise');

// 資料庫連線配置 (使用Railway環境變數)
const dbConfig = {
    host: process.env.DB_HOST || 'mysql.railway.internal',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ziYjdllesNJHAiQupdvQnWZRlrCXBfPg',
    database: process.env.DB_NAME || 'railway'
};

async function checkDatabase() {
    let connection;
    try {
        console.log('🔍 正在連接資料庫...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ 資料庫連接成功！');
        
        // 檢查資料表是否存在
        console.log('\n📋 檢查資料表結構...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('現有資料表:', tables);
        
        if (tables.length === 0) {
            console.log('❌ 沒有找到任何資料表！');
            return;
        }
        
        // 檢查每個資料表的資料數量
        console.log('\n📊 檢查各資料表的資料數量...');
        
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            try {
                const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                const count = countResult[0].count;
                console.log(`${tableName}: ${count} 筆資料`);
                
                // 如果有資料，顯示前幾筆
                if (count > 0) {
                    const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
                    console.log(`${tableName} 範例資料:`, sampleData);
                }
            } catch (error) {
                console.error(`檢查 ${tableName} 時發生錯誤:`, error.message);
            }
        }
        
        // 特別檢查用戶和記帳記錄
        console.log('\n👥 檢查用戶資料...');
        try {
            const [users] = await connection.execute('SELECT id, username, email, created_at FROM users');
            console.log('用戶列表:', users);
        } catch (error) {
            console.log('用戶資料表不存在或查詢失敗:', error.message);
        }
        
        console.log('\n💰 檢查記帳記錄...');
        try {
            const [expenses] = await connection.execute('SELECT id, user_id, category, amount, description, date FROM expenses ORDER BY date DESC LIMIT 5');
            console.log('最近的記帳記錄:', expenses);
        } catch (error) {
            console.log('記帳記錄資料表不存在或查詢失敗:', error.message);
        }
        
        console.log('\n🏷️ 檢查分類資料...');
        try {
            const [categories] = await connection.execute('SELECT * FROM categories');
            console.log('分類列表:', categories);
        } catch (error) {
            console.log('分類資料表不存在或查詢失敗:', error.message);
        }
        
    } catch (error) {
        console.error('❌ 資料庫檢查失敗:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔒 資料庫連接已關閉');
        }
    }
}

// 執行檢查
checkDatabase().catch(console.error); 