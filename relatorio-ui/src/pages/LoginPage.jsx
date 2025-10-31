// relatorio-ui/src/pages/LoginPage.jsx 
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Alert, 
  Button 
} from '@mui/material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = useAuthStore((state) => state.login);
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const navigate = useNavigate();
  const location = useLocation();

  const from = '/';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      return; 
    }
    login(username, password);
  };

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);


  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Relatorio - Iniciar Sesión
        </Typography>
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          noValidate 
          sx={{ mt: 1 }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          
          {/* Show login error message if it exists */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            loading={isLoading} 
            disabled={isLoading}
          >
            Ingresar
          </Button>
          
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;