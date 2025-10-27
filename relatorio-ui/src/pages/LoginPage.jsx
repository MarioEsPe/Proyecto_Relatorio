// relatorio-ui/src/pages/LoginPage.jsx 
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

// Import Material-UI components
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Alert, 
  Button 
} from '@mui/material';

const LoginPage = () => {
  // --- 1. Local State for the Form ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // --- 2. State from Zustand Store ---
  // We select the pieces of state and actions we need
  const login = useAuthStore((state) => state.login);
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  // --- 3. React Router Hooks ---
  const navigate = useNavigate();
  const location = useLocation();
  // Get the 'from' path saved by ProtectedRoute, or default to dashboard
  const from = location.state?.from?.pathname || '/';

  // --- 4. Submit Handler ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      // Opcional: validación local antes de llamar al store
      return; 
    }
    // Call the login action from our store
    login(username, password);
  };

  // --- 5. Effect for Redirection ---
  // This effect runs when the 'token' value changes.
  useEffect(() => {
    if (token) {
      // Login was successful!
      // Navigate to the page the user was trying to access.
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);


  // --- 6. The UI (JSX) ---
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