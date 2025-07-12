import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  CircularProgress, 
  Typography 
} from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 載入中顯示載入畫面
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} />
        <Typography 
          variant="h6" 
          sx={{ mt: 2, color: 'text.secondary' }}
        >
          載入中...
        </Typography>
      </Box>
    );
  }

  // 未登入則重定向到登入頁面
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登入則顯示子組件
  return children;
};

export default PrivateRoute; 