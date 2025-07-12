import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Alert, 
  Snackbar 
} from '@mui/material';
import api from '../services/api';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // 載入分類
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('載入分類失敗:', error);
      setAlert({
        open: true,
        message: '載入分類失敗',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 載入記帳記錄
  const loadExpenses = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/expenses?${queryParams}`);
      setExpenses(response.data.data.expenses);
      return response.data.data;
    } catch (error) {
      console.error('載入記帳記錄失敗:', error);
      setAlert({
        open: true,
        message: '載入記帳記錄失敗',
        severity: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 載入統計資料
  const loadStatistics = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/expenses/statistics?${queryParams}`);
      setStatistics(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('載入統計資料失敗:', error);
      setAlert({
        open: true,
        message: '載入統計資料失敗',
        severity: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 新增記帳記錄
  const addExpense = async (expenseData) => {
    try {
      setLoading(true);
      
      // 格式化日期和欄位名稱以符合後端要求
      const formattedData = {
        ...expenseData,
        transaction_date: expenseData.date instanceof Date 
          ? expenseData.date.toISOString().split('T')[0] 
          : expenseData.date
      };
      
      // 移除前端的 date 欄位，使用 transaction_date
      delete formattedData.date;
      
      const response = await api.post('/expenses', formattedData);
      
      // 更新本地記帳記錄
      setExpenses(prev => [response.data.data.expense, ...prev]);
      
      setAlert({
        open: true,
        message: '記帳記錄新增成功！',
        severity: 'success'
      });
      
      return { success: true, data: response.data.data.expense };
    } catch (error) {
      const message = error.response?.data?.message || '新增記帳記錄失敗';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 快速記帳
  const quickExpense = async (expenseData) => {
    try {
      setLoading(true);
      
      // 格式化日期和欄位名稱以符合後端要求
      const formattedData = {
        ...expenseData,
        transaction_date: expenseData.date instanceof Date 
          ? expenseData.date.toISOString().split('T')[0] 
          : expenseData.date
      };
      
      // 移除前端的 date 欄位，使用 transaction_date
      delete formattedData.date;
      
      const response = await api.post('/expenses/quick', formattedData);
      
      // 更新本地記帳記錄
      setExpenses(prev => [response.data.data.expense, ...prev]);
      
      // 如果新增了分類，更新分類列表
      if (response.data.data.classification?.isAutoClassified) {
        await loadCategories();
      }
      
      setAlert({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || '快速記帳失敗';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 更新記帳記錄
  const updateExpense = async (id, expenseData) => {
    try {
      setLoading(true);
      
      // 格式化日期和欄位名稱以符合後端要求
      const formattedData = {
        ...expenseData,
        transaction_date: expenseData.date instanceof Date 
          ? expenseData.date.toISOString().split('T')[0] 
          : expenseData.date
      };
      
      // 移除前端的 date 欄位，使用 transaction_date
      delete formattedData.date;
      
      const response = await api.put(`/expenses/${id}`, formattedData);
      
      // 更新本地記帳記錄
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? response.data.data.expense : expense
        )
      );
      
      setAlert({
        open: true,
        message: '記帳記錄更新成功！',
        severity: 'success'
      });
      
      return { success: true, data: response.data.data.expense };
    } catch (error) {
      const message = error.response?.data?.message || '更新記帳記錄失敗';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 刪除記帳記錄
  const deleteExpense = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/expenses/${id}`);
      
      // 從本地記帳記錄中移除
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      setAlert({
        open: true,
        message: '記帳記錄刪除成功！',
        severity: 'success'
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '刪除記帳記錄失敗';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 新增分類
  const addCategory = async (categoryData) => {
    try {
      setLoading(true);
      const response = await api.post('/categories', categoryData);
      
      // 更新本地分類列表
      setCategories(prev => [...prev, response.data.data.category]);
      
      setAlert({
        open: true,
        message: '分類新增成功！',
        severity: 'success'
      });
      
      return { success: true, data: response.data.data.category };
    } catch (error) {
      const message = error.response?.data?.message || '新增分類失敗';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 更新分類
  const updateCategory = async (id, categoryData) => {
    try {
      setLoading(true);
      const response = await api.put(`/categories/${id}`, categoryData);
      
      // 更新本地分類列表
      setCategories(prev => 
        prev.map(category => 
          category.id === id ? response.data.data.category : category
        )
      );
      
      setAlert({
        open: true,
        message: '分類更新成功！',
        severity: 'success'
      });
      
      return { success: true, data: response.data.data.category };
    } catch (error) {
      const message = error.response?.data?.message || '更新分類失敗';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 刪除分類
  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/categories/${id}`);
      
      // 從本地分類列表中移除
      setCategories(prev => prev.filter(category => category.id !== id));
      
      setAlert({
        open: true,
        message: '分類刪除成功！',
        severity: 'success'
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '刪除分類失敗';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 獲取分類建議
  const getCategorySuggestion = async (categoryName) => {
    try {
      const response = await api.post('/expenses/classify-suggestion', {
        categoryName
      });
      return response.data.data;
    } catch (error) {
      console.error('獲取分類建議失敗:', error);
      return null;
    }
  };

  // 關閉提示訊息
  const closeAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // 為了兼容性，添加別名函數
  const getStats = loadStatistics;
  const getExpenses = loadExpenses;
  const getCategories = loadCategories;

  const value = {
    expenses,
    categories,
    statistics,
    loading,
    loadCategories,
    loadExpenses,
    loadStatistics,
    getStats,
    getExpenses,
    getCategories,
    addExpense,
    quickExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategorySuggestion,
    alert,
    closeAlert
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={closeAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeAlert} 
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </ExpenseContext.Provider>
  );
}; 