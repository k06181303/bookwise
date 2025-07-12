/**
 * 智能分類判斷工具
 * 根據分類名稱自動判斷收入或支出類型
 */

// 收入關鍵字
const INCOME_KEYWORDS = [
    // 工作收入
    '薪資', '薪水', '工資', '獎金', '津貼', '年終', '分紅', '佣金', '提成',
    '兼職', '打工', '外快', '接案', '代班', '加班費',
    
    // 投資收入
    '投資', '股票', '基金', '債券', '定存', '利息', '股利', '股息', '配息',
    '收益', '報酬', '獲利', '盈利', '分息',
    '租金', '房租', '店租', '租賃', '出租',
    
    // 其他收入
    '獎學金', '補助', '退稅', '退款', '回饋', '現金回饋', '紅利', '點數',
    '賣出', '二手', '轉賣', '變賣', '中獎', '獎金', '禮金', '紅包',
    '退休金', '保險金', '理賠', '補償'
];

// 支出關鍵字
const EXPENSE_KEYWORDS = [
    // 食物相關
    '餐飲', '食物', '早餐', '午餐', '晚餐', '宵夜', '飲料', '咖啡', '茶',
    '零食', '水果', '蔬菜', '肉類', '海鮮', '便當', '外食', '聚餐',
    '餐廳', '小吃', '速食', '火鍋', '燒烤', '飲品', '酒類',
    
    // 交通相關
    '交通', '計程車', '公車', '捷運', '高鐵', '火車', '飛機', '機票',
    '汽油', '停車', '過路費', '車資', '搭車', '油費', '停車費',
    '運費', '快遞', '宅配', '郵費', '運輸',
    
    // 購物相關
    '購物', '買', '購買', '商品', '用品', '服飾', '衣服', '鞋子', '包包',
    '化妝品', '保養品', '電器', '3C', '手機', '電腦', '家具', '裝潢',
    '書籍', '文具', '玩具', '禮物', '送禮',
    
    // 娛樂相關
    '娛樂', '電影', '遊戲', '旅遊', '旅行', '住宿', '飯店', '民宿',
    '門票', '票', '演唱會', '表演', '展覽', '遊樂園', 'KTV', '唱歌',
    '運動', '健身', '游泳', '球類', '課程', '學習',
    
    // 生活必需
    '居住', '房租', '水電', '瓦斯', '電費', '水費', '網路', '電話',
    '清潔', '洗衣', '修理', '維修', '保養', '清潔用品', '生活用品',
    
    // 醫療保健
    '醫療', '看病', '診所', '醫院', '藥品', '藥局', '保健', '健康',
    '牙科', '眼科', '體檢', '疫苗', '治療', '復健',
    
    // 教育相關
    '教育', '學費', '補習', '課程', '培訓', '考試', '證照', '學習',
    '書籍', '教材', '學用品',
    
    // 保險稅務
    '保險', '稅務', '稅金', '罰款', '手續費', '服務費', '管理費',
    '年費', '月費', '會員費', '訂閱'
];

/**
 * 根據分類名稱自動判斷收入或支出類型
 * @param {string} categoryName 分類名稱
 * @returns {string} 'income' 或 'expense' 或 null（無法判斷）
 */
function classifyCategory(categoryName) {
    if (!categoryName || typeof categoryName !== 'string') {
        return null;
    }

    const name = categoryName.trim();
    
    // 檢查是否包含收入關鍵字
    const isIncome = INCOME_KEYWORDS.some(keyword => 
        name.includes(keyword)
    );
    
    // 檢查是否包含支出關鍵字
    const isExpense = EXPENSE_KEYWORDS.some(keyword => 
        name.includes(keyword)
    );
    
    // 如果同時匹配收入和支出關鍵字，優先判斷為支出
    if (isExpense) {
        return 'expense';
    }
    
    if (isIncome) {
        return 'income';
    }
    
    // 無法判斷，返回 null
    return null;
}

/**
 * 獲取建議的分類類型和置信度
 * @param {string} categoryName 分類名稱
 * @returns {Object} { type: string, confidence: number, reason: string }
 */
function getSuggestedType(categoryName) {
    const type = classifyCategory(categoryName);
    
    if (!type) {
        return {
            type: null,
            confidence: 0,
            reason: '無法從分類名稱判斷類型'
        };
    }
    
    const name = categoryName.trim();
    
    // 計算置信度
    const keywords = type === 'income' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;
    const matchingKeywords = keywords.filter(keyword => 
        name.includes(keyword)
    );
    
    const confidence = Math.min(0.9, matchingKeywords.length * 0.3 + 0.6);
    
    return {
        type,
        confidence,
        reason: `匹配關鍵字: ${matchingKeywords.join(', ')}`,
        matchingKeywords
    };
}

/**
 * 獲取推薦顏色
 * @param {string} type 分類類型
 * @param {string} categoryName 分類名稱
 * @returns {string} 十六進制顏色代碼
 */
function getRecommendedColor(type, categoryName) {
    const colors = {
        income: {
            default: '#28a745',
            '薪資': '#007bff',
            '投資': '#17a2b8',
            '租金': '#6f42c1',
            '其他': '#6c757d'
        },
        expense: {
            default: '#dc3545',
            '餐飲': '#fd7e14',
            '交通': '#6f42c1',
            '購物': '#e83e8c',
            '娛樂': '#20c997',
            '醫療': '#dc3545',
            '居住': '#6c757d',
            '教育': '#007bff',
            '其他': '#343a40'
        }
    };
    
    if (!colors[type]) {
        return '#6c757d';
    }
    
    const typeColors = colors[type];
    const name = categoryName.trim();
    
    // 尋找匹配的顏色
    for (const [keyword, color] of Object.entries(typeColors)) {
        if (keyword !== 'default' && name.includes(keyword)) {
            return color;
        }
    }
    
    return typeColors.default;
}

module.exports = {
    classifyCategory,
    getSuggestedType,
    getRecommendedColor,
    INCOME_KEYWORDS,
    EXPENSE_KEYWORDS
}; 