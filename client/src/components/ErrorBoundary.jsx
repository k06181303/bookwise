import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('錯誤邊界捕獲到錯誤:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              應用程式發生錯誤
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              很抱歉，應用程式遇到了一個問題。請嘗試重新整理頁面，或聯繫技術支援。
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '16px', textAlign: 'left' }}>
                <summary>錯誤詳情 (開發模式)</summary>
                <pre style={{ fontSize: '12px', marginTop: '8px' }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Alert>
          
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={this.handleRefresh}
            size="large"
          >
            重新整理頁面
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 