import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Alert, 
  Snackbar 
} from '@mui/material';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  // 檢查用戶是否已登入
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // 設定 API 預設 headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await api.get('/auth/profile');
          setUser(response.data.data.user);
        } catch (error) {
          console.error('Token 驗證失敗:', error);
          // 清除無效的 token
          setToken(null);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 登入
  const login = async (loginField, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        loginField,
        password
      });

      const { user, auth } = response.data.data;
      const accessToken = auth.accessToken;

      setUser(user);
      setToken(accessToken);
      localStorage.setItem('token', accessToken);

      // 設定 API 預設 headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      setAlert({
        open: true,
        message: '登入成功！',
        severity: 'success'
      });

      // 不在這裡導航，讓 Login 頁面控制跳轉
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '登入失敗，請檢查帳號密碼';
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

  // 註冊
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);

      const { user, auth } = response.data.data;
      const accessToken = auth.accessToken;

      setUser(user);
      setToken(accessToken);
      localStorage.setItem('token', accessToken);

      // 設定 API 預設 headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      setAlert({
        open: true,
        message: '註冊成功！已自動建立預設分類',
        severity: 'success'
      });

      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '註冊失敗，請稍後再試';
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

  // 登出
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // 更新用戶資料
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.data.user);
      
      setAlert({
        open: true,
        message: '個人資料更新成功！',
        severity: 'success'
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '更新失敗，請稍後再試';
      setAlert({
        open: true,
        message,
        severity: 'error'
      });
      return { success: false, error: message };
    }
  };

  // 關閉提示訊息
  const closeAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    alert,
    closeAlert
  };

  return (
    <AuthContext.Provider value={value}>
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
    </AuthContext.Provider>
  );
}; 