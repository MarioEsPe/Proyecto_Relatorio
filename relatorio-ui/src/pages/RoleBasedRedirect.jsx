// relatorio-ui/src/pages/RoleBasedRedirect.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * This component acts as the default index page ("/") for logged-in users.
 * It reads the user's role from the auth store and redirects them to the
 * appropriate dashboard.
 */
const RoleBasedRedirect = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user data...</Typography>
      </Box>
    );
  }

  if (user.role === 'OPS_MANAGER') {
 
    return <Navigate to="/equipment" replace />;
  }

  if (user.role === 'SHIFT_SUPERINTENDENT') {
 
    return <Navigate to="/active-shift" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;