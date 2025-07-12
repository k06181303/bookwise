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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  MoreVert as MoreVertIcon,
  Receipt as ReceiptIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useExpense } from '../contexts/ExpenseContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { zhTW } from 'date-fns/locale';

const Expenses = () => {
  const { expenses, categories, addExpense, updateExpense, deleteExpense, getExpenses, getCategories } = useExpense();
  const [expensesList, setExpensesList] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    date: new Date(),
    type: 'expense'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState(null);
  const [filterDateTo, setFilterDateTo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [contextMenuExpense, setContextMenuExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await getCategories();
        await loadExpenses();
        setLoading(false);
      } catch (err) {
        console.error('載入記帳記錄失敗:', err);
        setError('載入記帳記錄失敗，請重試');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expensesList, searchTerm, filterCategory, filterType, filterDateFrom, filterDateTo]);

  const loadExpenses = async () => {
    try {
      const data = await getExpenses({ 
        page: page + 1, 
        limit: rowsPerPage 
      });
      setExpensesList(data.expenses || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('載入記帳記錄失敗:', err);
      setError('載入記帳記錄失敗');
    }
  };

  const applyFilters = () => {
    let filtered = [...expensesList];

    // 搜尋篩選
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 分類篩選
    if (filterCategory) {
      filtered = filtered.filter(expense => expense.category_id === filterCategory);
    }

    // 類型篩選
    if (filterType) {
      filtered = filtered.filter(expense => expense.type === filterType);
    }

    // 日期篩選
    if (filterDateFrom) {
      filtered = filtered.filter(expense => new Date(expense.date) >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(expense => new Date(expense.date) <= filterDateTo);
    }

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.description || !formData.amount) {
        setError('請填寫描述和金額');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('請輸入有效的金額');
        return;
      }

      const expenseData = {
        ...formData,
        amount: amount
      };

      if (selectedExpense) {
        await updateExpense(selectedExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      await loadExpenses();
      handleCloseDialog();
      setError('');
    } catch (err) {
      console.error('儲存記帳記錄失敗:', err);
      setError('儲存記帳記錄失敗，請重試');
    }
  };

  const handleDelete = async (expense) => {
    try {
      await deleteExpense(expense.id);
      await loadExpenses();
      setAnchorEl(null);
    } catch (err) {
      console.error('刪除記帳記錄失敗:', err);
      setError('刪除記帳記錄失敗，請重試');
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      date: new Date(expense.date),
      type: expense.type
    });
    setShowDialog(true);
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedExpense(null);
    setFormData({
      description: '',
      amount: '',
      category_id: '',
      date: new Date(),
      type: 'expense'
    });
  };

  const handleContextMenu = (event, expense) => {
    event.preventDefault();
    setContextMenuExpense(expense);
    setAnchorEl(event.currentTarget);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterType('');
    setFilterDateFrom(null);
    setFilterDateTo(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getTypeText = (type) => {
    return type === 'income' ? '收入' : '支出';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon />
        記帳記錄
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 搜尋和篩選 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            label="搜尋記帳記錄"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            篩選
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
          >
            清除篩選
          </Button>
        </Box>

        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>分類</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>類型</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="income">收入</MenuItem>
                <MenuItem value="expense">支出</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="開始日期"
                value={filterDateFrom}
                onChange={setFilterDateFrom}
                renderInput={(params) => <TextField {...params} />}
              />
              <DatePicker
                label="結束日期"
                value={filterDateTo}
                onChange={setFilterDateTo}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </Box>
        )}
      </Paper>

      {/* 記帳記錄表格 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>日期</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>分類</TableCell>
              <TableCell>類型</TableCell>
              <TableCell align="right">金額</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    找不到符合條件的記帳記錄
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>
                    {new Date(expense.date).toLocaleDateString('zh-TW')}
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={expense.category_name}
                      size="small"
                      sx={{ bgcolor: expense.category_color, color: 'white' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeText(expense.type)}
                      size="small"
                      color={getTypeColor(expense.type)}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleContextMenu(e, expense)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* 新增記帳按鈕 */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => setShowDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* 記帳記錄對話框 */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedExpense ? '編輯記帳記錄' : '新增記帳記錄'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="記帳描述"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                required
              />
              
              <TextField
                label="金額"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                fullWidth
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>NT$</Typography>
                }}
              />
              
              <FormControl fullWidth>
                <InputLabel>分類</InputLabel>
                <Select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
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

              <FormControl fullWidth>
                <InputLabel>類型</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="expense">支出</MenuItem>
                  <MenuItem value="income">收入</MenuItem>
                </Select>
              </FormControl>
              
              <DatePicker
                label="記帳日期"
                value={formData.date}
                onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedExpense ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 操作選單 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleEdit(contextMenuExpense)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編輯</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDelete(contextMenuExpense)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>刪除</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Expenses; 