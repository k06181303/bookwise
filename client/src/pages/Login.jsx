import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  AccountBalance as BookIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    loginField: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除對應欄位的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginField.trim()) {
      newErrors.loginField = '請輸入使用者名稱或電子信箱';
    }

    if (!formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼長度至少6個字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(formData.loginField, formData.password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        // 登入失敗時不要跳轉，AuthContext 會顯示錯誤提醒
        console.log('登入失敗:', result.error);
      }
    } catch (error) {
      console.error('登入失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        padding: 2,
        boxSizing: 'border-box',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 1
        }}
      >
          <CardContent sx={{ p: 5 }}>
            {/* 標題區域 */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                }}
              >
                <BookIcon sx={{ fontSize: 32, color: 'white' }} />
              </Avatar>
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Bookwise
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 400,
                  mb: 1
                }}
              >
                歡迎回來
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  opacity: 0.8
                }}
              >
                請登入您的帳戶以繼續使用
              </Typography>
            </Box>

            {/* 登入表單 */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="loginField"
                label="使用者名稱或電子信箱"
                name="loginField"
                autoComplete="username"
                autoFocus
                value={formData.loginField}
                onChange={handleChange}
                error={!!errors.loginField}
                helperText={errors.loginField}
                disabled={isSubmitting}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
                    }
                  }
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="密碼"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isSubmitting}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                sx={{
                  mt: 1,
                  mb: 3,
                  py: 1.8,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-2px)'
                  },
                  '&:disabled': {
                    background: 'rgba(102, 126, 234, 0.6)',
                    boxShadow: 'none',
                    transform: 'none'
                  }
                }}
              >
                {isSubmitting ? '登入中...' : '登入'}
              </Button>

              <Divider sx={{ my: 2, opacity: 0.6 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  還沒有帳號？{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    sx={{
                      textDecoration: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    立即註冊
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Paper>
    </Box>
  );
};

export default Login; 