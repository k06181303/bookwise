import axios from 'axios';

// 建立 axios 實例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器 - 處理錯誤
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 處理 401 未授權錯誤
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // 處理 403 禁止存取錯誤
    if (error.response?.status === 403) {
      console.error('存取被拒絕:', error.response.data);
    }
    
    // 處理 500 伺服器錯誤
    if (error.response?.status >= 500) {
      console.error('伺服器錯誤:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api; 