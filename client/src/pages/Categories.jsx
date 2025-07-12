import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  MoreVert as MoreVertIcon,
  Palette as PaletteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useExpense } from '../contexts/ExpenseContext';

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, getCategories } = useExpense();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#2196F3',
    type: 'expense'
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [contextMenuCategory, setContextMenuCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 預設顏色選項
  const colorOptions = [
    { value: '#2196F3', name: '藍色' },
    { value: '#4CAF50', name: '綠色' },
    { value: '#FF9800', name: '橙色' },
    { value: '#F44336', name: '紅色' },
    { value: '#9C27B0', name: '紫色' },
    { value: '#607D8B', name: '藍灰色' },
    { value: '#795548', name: '棕色' },
    { value: '#E91E63', name: '粉色' },
    { value: '#009688', name: '藍綠色' },
    { value: '#FFC107', name: '黃色' },
    { value: '#673AB7', name: '深紫色' },
    { value: '#FF5722', name: '深橙色' }
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        await getCategories();
        setLoading(false);
      } catch (err) {
        console.error('載入分類失敗:', err);
        setError('載入分類失敗，請重試');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        setError('請輸入分類名稱');
        return;
      }

      const categoryData = {
        name: formData.name.trim(),
        color: formData.color,
        type: formData.type
      };

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, categoryData);
      } else {
        await addCategory(categoryData);
      }

      await getCategories();
      handleCloseDialog();
      setError('');
    } catch (err) {
      console.error('儲存分類失敗:', err);
      setError('儲存分類失敗，請重試');
    }
  };

  const handleDelete = async (category) => {
    try {
      await deleteCategory(category.id);
      await getCategories();
      setAnchorEl(null);
    } catch (err) {
      console.error('刪除分類失敗:', err);
      setError('刪除分類失敗，請重試');
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      type: category.type
    });
    setShowDialog(true);
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      color: '#2196F3',
      type: 'expense'
    });
  };

  const handleContextMenu = (event, category) => {
    event.preventDefault();
    setContextMenuCategory(category);
    setAnchorEl(event.currentTarget);
  };

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = [];
    }
    acc[category.type].push(category);
    return acc;
  }, {});

  const getTypeIcon = (type) => {
    return type === 'income' ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getTypeText = (type) => {
    return type === 'income' ? '收入' : '支出';
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CategoryIcon />
        分類管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 分類統計 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                總分類數量
              </Typography>
              <Typography variant="h3" color="primary">
                {categories.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                收入分類
              </Typography>
              <Typography variant="h3" color="success.main">
                {groupedCategories.income?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                支出分類
              </Typography>
              <Typography variant="h3" color="error.main">
                {groupedCategories.expense?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 分類列表 */}
      <Grid container spacing={3}>
        {Object.entries(groupedCategories).map(([type, categoryList]) => (
          <Grid item xs={12} md={6} key={type}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTypeIcon(type)}
                {getTypeText(type)}分類
                <Chip 
                  label={categoryList.length} 
                  size="small" 
                  color={getTypeColor(type)}
                />
              </Typography>
              
              {categoryList.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  還沒有{getTypeText(type)}分類
                </Typography>
              ) : (
                <List>
                  {categoryList.map((category, index) => (
                    <React.Fragment key={category.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: category.color }}>
                            <CategoryIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={category.name}
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              使用次數: {category.usage_count || 0}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={(e) => handleContextMenu(e, category)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < categoryList.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 新增分類按鈕 */}
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

      {/* 分類對話框 */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCategory ? '編輯分類' : '新增分類'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="分類名稱"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>分類類型</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="expense">支出</MenuItem>
                <MenuItem value="income">收入</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaletteIcon />
                選擇顏色
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {colorOptions.map((option) => (
                  <Tooltip key={option.value} title={option.name}>
                    <IconButton
                      onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                      sx={{
                        bgcolor: option.value,
                        color: 'white',
                        border: formData.color === option.value ? '3px solid #000' : '1px solid #ccc',
                        '&:hover': {
                          bgcolor: option.value,
                          opacity: 0.8
                        }
                      }}
                    >
                      <CategoryIcon />
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            </Box>

            {/* 顏色預覽 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">預覽：</Typography>
              <Chip 
                label={formData.name || '分類名稱'} 
                sx={{ bgcolor: formData.color, color: 'white' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedCategory ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 操作選單 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleEdit(contextMenuCategory)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編輯</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDelete(contextMenuCategory)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>刪除</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Categories; 