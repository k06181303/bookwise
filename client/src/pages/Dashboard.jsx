import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Category as CategoryIcon,
  ExpandMore as ExpandMoreIcon,
  Receipt as ReceiptIcon,
  Savings as SavingsIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { useExpense } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { zhTW } from 'date-fns/locale';

const Dashboard = () => {
  const { user } = useAuth();
  const { expenses, categories, addExpense, getExpenses, getCategories, getStats } = useExpense();
  const [stats, setStats] = useState({});
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    description: '',
    amount: '',
    category_id: '',
    date: new Date()
  });
  const [showRecentExpanded, setShowRecentExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 獲取統計數據
        const statsData = await getStats();
        setStats(statsData);
        
        // 獲取最近記帳記錄
        const expensesData = await getExpenses({ limit: 5 });
        setRecentExpenses(expensesData.expenses || []);
        
        // 獲取分類列表
        await getCategories();
        
        setLoading(false);
      } catch (err) {
        console.error('載入儀表板數據失敗:', err);
        setError('載入數據失敗，請重試');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleQuickAdd = async () => {
    try {
      if (!quickAddData.description || !quickAddData.amount) {
        setError('請填寫描述和金額');
        return;
      }

      const amount = parseFloat(quickAddData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('請輸入有效的金額');
        return;
      }

      await addExpense({
        ...quickAddData,
        amount: amount
      });

      // 重新載入數據
      const statsData = await getStats();
      setStats(statsData);
      const expensesData = await getExpenses({ limit: 5 });
      setRecentExpenses(expensesData.expenses || []);

      // 重置表單
      setQuickAddData({
        description: '',
        amount: '',
        category_id: '',
        date: new Date()
      });
      setShowQuickAdd(false);
      setError('');
    } catch (err) {
      console.error('新增記帳失敗:', err);
      setError('新增記帳失敗，請重試');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getIncomeExpenseData = () => {
    // 適配後端返回的統計數據格式
    const income = stats?.summary?.income?.total || 0;
    const expense = stats?.summary?.expense?.total || 0;
    return { income, expense, balance: income - expense };
  };

  const { income, expense, balance } = getIncomeExpenseData();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 歡迎訊息 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.username?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h4" gutterBottom>
            歡迎回來，{user?.username}！
          </Typography>
          <Typography variant="body2" color="text.secondary">
            今天是記帳的好日子 📊
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">本月收入</Typography>
                  <Typography variant="h4">{formatCurrency(income)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingDownIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">本月支出</Typography>
                  <Typography variant="h4">{formatCurrency(expense)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: balance >= 0 ? 'info.light' : 'warning.light', 
            color: balance >= 0 ? 'info.contrastText' : 'warning.contrastText' 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">本月結餘</Typography>
                  <Typography variant="h4">{formatCurrency(balance)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 最近記帳記錄 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon />
              最近記帳記錄
            </Typography>
            <IconButton onClick={() => setShowRecentExpanded(!showRecentExpanded)}>
              <ExpandMoreIcon 
                sx={{ 
                  transform: showRecentExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </IconButton>
          </Box>
          
          <Collapse in={showRecentExpanded} timeout="auto" unmountOnExit>
            {recentExpenses.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                還沒有記帳記錄，開始你的第一筆記帳吧！
              </Typography>
            ) : (
              <List>
                {recentExpenses.map((expense, index) => (
                  <React.Fragment key={expense.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">{expense.description}</Typography>
                              <Chip 
                                label={expense.category_name} 
                                size="small"
                                sx={{ bgcolor: expense.category_color, color: 'white' }}
                              />
                            </Box>
                            <Typography 
                              variant="body1" 
                              color={expense.type === 'income' ? 'success.main' : 'error.main'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={new Date(expense.date).toLocaleDateString('zh-TW')}
                      />
                    </ListItem>
                    {index < recentExpenses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* 快速記帳按鈕 */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => setShowQuickAdd(true)}
      >
        <AddIcon />
      </Fab>

      {/* 快速記帳對話框 */}
      <Dialog open={showQuickAdd} onClose={() => setShowQuickAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>快速記帳</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="記帳描述"
                value={quickAddData.description}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                required
              />
              
              <TextField
                label="金額"
                type="number"
                value={quickAddData.amount}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, amount: e.target.value }))}
                fullWidth
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>NT$</Typography>
                }}
              />
              
              <FormControl fullWidth>
                <InputLabel>分類</InputLabel>
                <Select
                  value={quickAddData.category_id}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            bgcolor: category.color 
                          }} 
                        />
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <DatePicker
                label="記帳日期"
                value={quickAddData.date}
                onChange={(date) => setQuickAddData(prev => ({ ...prev, date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuickAdd(false)}>取消</Button>
          <Button onClick={handleQuickAdd} variant="contained">確認記帳</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 