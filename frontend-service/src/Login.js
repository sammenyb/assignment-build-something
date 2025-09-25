import React, { useState } from 'react';

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
          ? 'http://localhost:8000/login'
          : 'http://localhost:8000/register';
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
    <form onSubmit={handleSubmit}>
      <h3>{mode === 'login' ? 'Login' : 'Register'}</h3>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 8 }}
      />
      <button type="submit" style={{ width: '100%' }}>
        {mode === 'login' ? 'Login' : 'Register'}
      </button>
      <div style={{ marginTop: 8 }}>
        {mode === 'login' ? (
          <span>
            Need an account?{' '}
            <button type="button" onClick={() => setMode('register')}>
              Register
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button type="button" onClick={() => setMode('login')}>
              Login
            </button>
          </span>
        )}
      </div>
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </form>
  );
}

export default Login;
