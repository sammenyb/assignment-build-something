import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, IconButton, Button, Box } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import useMediaQuery from '@mui/material/useMediaQuery';
import Login from './Login';
import FileManager from './FileManager';

function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDark ? 'dark' : 'light');

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '60vw', mx: 'auto', mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <h2 style={{ margin: 0 }}>Cloud Storage App</h2>
          <Box>
            <IconButton
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              color="inherit"
              sx={{ mr: token ? 2 : 0 }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {token && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleLogout}
                sx={{ mb: 0 }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Box>
        {token ? (
          <FileManager token={token} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;