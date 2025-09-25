import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, Link } from '@mui/material';

function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const url =
        mode === 'login'
          ? 'http://192.168.49.2:30080/login'
          : 'http://192.168.49.2:30080/register';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `${mode} failed`);
      if (mode === 'login') {
        onLogin(data.access_token);
      } else {
        setMode('login');
        setErr('Registration successful! Please log in.');
      }
    } catch (e) {
      setErr(`Error: ${mode} failed`);
    }
  };

  return (
    <Box
      component={Paper}
      elevation={3}
      sx={{
        maxWidth: 350,
        mx: 'auto',
        mt: 8,
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        {mode === 'login' ? 'Login' : 'Register'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" fullWidth>
          {mode === 'login' ? 'Login' : 'Register'}
        </Button>
      </Box>
      <Box textAlign="center">
        {mode === 'login' ? (
          <Typography variant="body2">
            Need an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => setMode('register')}
            >
              Register
            </Link>
          </Typography>
        ) : (
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => setMode('login')}
            >
              Login
            </Link>
          </Typography>
        )}
      </Box>
      {err && <Alert severity="error">{err}</Alert>}
    </Box>
  );
}

export default Login;
