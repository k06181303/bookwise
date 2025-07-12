import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  Savings as SavingsIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { useExpense } from '../contexts/ExpenseContext';

const Statistics = () => {
  const { loadStatistics, loadExpenses, categories } = useExpense();
  const [stats, setStats] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 載入統計數據
        const statsData = await loadStatistics();
        
        if (statsData) {
          setStats(statsData);
          // 處理分類統計數據
          if (statsData.categoryBreakdown) {
            setCategoryBreakdown(statsData.categoryBreakdown);
          }
        } else {
          setStats({});
        }
        
        setLoading(false);
      } catch (err) {
        console.error('載入統計數據失敗:', err);
        setError(`載入統計數據失敗: ${err.message}`);
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [loadStatistics]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getIncomeExpenseData = () => {
    if (!stats || !stats.summary) {
      return { income: 0, expense: 0, balance: 0, incomeCount: 0, expenseCount: 0 };
    }
    
    const income = stats.summary.income?.total || 0;
    const expense = stats.summary.expense?.total || 0;
    const incomeCount = stats.summary.income?.count || 0;
    const expenseCount = stats.summary.expense?.count || 0;
    
    return { income, expense, balance: income - expense, incomeCount, expenseCount };
  };

  const { income, expense, balance, incomeCount, expenseCount } = getIncomeExpenseData();

  const getSavingsRate = () => {
    if (income === 0) return 0;
    return ((balance / income) * 100).toFixed(1);
  };

  const getExpenseRatio = () => {
    if (income === 0) return 0;
    return ((expense / income) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入統計數據中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon />
        統計分析
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 主要統計概覽 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: 'success.light', 
            color: 'success.contrastText',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            boxShadow: 3
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">本月收入</Typography>
                  <Typography variant="h4">{formatCurrency(income)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {incomeCount} 筆收入
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            background: 'linear-gradient(135deg, #F44336 0%, #d32f2f 100%)',
            boxShadow: 3
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingDownIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">本月支出</Typography>
                  <Typography variant="h4">{formatCurrency(expense)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {expenseCount} 筆支出
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: balance >= 0 ? 'info.light' : 'warning.light', 
            color: balance >= 0 ? 'info.contrastText' : 'warning.contrastText',
            background: balance >= 0 
              ? 'linear-gradient(135deg, #2196F3 0%, #1976d2 100%)'
              : 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
            boxShadow: 3
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">本月結餘</Typography>
                  <Typography variant="h4">{formatCurrency(balance)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {balance >= 0 ? '收支平衡' : '入不敷出'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #9C27B0 0%, #7b1fa2 100%)',
            color: 'white',
            boxShadow: 3
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimelineIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">記帳筆數</Typography>
                  <Typography variant="h4">{incomeCount + expenseCount}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    本月活躍度
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 財務健康度分析 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SavingsIcon />
                財務健康度分析
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  儲蓄率
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(0, Math.min(100, parseFloat(getSavingsRate())))}
                    sx={{ 
                      flex: 1, 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: parseFloat(getSavingsRate()) > 20 ? '#4CAF50' : '#FF9800'
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '50px' }}>
                    {getSavingsRate()}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  支出收入比
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, parseFloat(getExpenseRatio()))}
                    sx={{ 
                      flex: 1, 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: parseFloat(getExpenseRatio()) > 100 ? '#F44336' : '#4CAF50'
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '50px' }}>
                    {getExpenseRatio()}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={balance >= 0 ? '財務健康' : '需要注意'}
                  color={balance >= 0 ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={`日均支出: ${formatCurrency(expense / 30)}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`記帳習慣: ${(incomeCount + expenseCount) > 20 ? '良好' : '需改善'}`}
                  color={(incomeCount + expenseCount) > 20 ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MonetizationOnIcon />
                快速統計
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                    <Typography variant="h4" color="success.main">
                      {incomeCount}
                    </Typography>
                    <Typography variant="body2">收入筆數</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h4" color="error.main">
                      {expenseCount}
                    </Typography>
                    <Typography variant="body2">支出筆數</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                    <Typography variant="h4" color="primary.main">
                      {income > 0 ? formatCurrency(income / incomeCount) : '$0'}
                    </Typography>
                    <Typography variant="body2">平均收入</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light' }}>
                    <Typography variant="h4" color="secondary.main">
                      {expense > 0 ? formatCurrency(expense / expenseCount) : '$0'}
                    </Typography>
                    <Typography variant="body2">平均支出</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 分類支出統計 */}
      {categoryBreakdown && categoryBreakdown.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon />
              分類支出統計
            </Typography>
            
            <List>
              {categoryBreakdown.map((category, index) => (
                <React.Fragment key={category.category?.id || index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: category.category?.color || '#2196F3',
                        width: 40,
                        height: 40
                      }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {category.category?.name || '未知分類'}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(category.total)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {category.count} 筆交易
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              平均 {formatCurrency(category.total / category.count)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, (category.total / expense) * 100)}
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: category.category?.color || '#2196F3'
                              }
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < categoryBreakdown.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Statistics; 