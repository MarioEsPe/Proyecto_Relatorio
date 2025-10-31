// relatorio-ui/src/pages/DashboardPage.jsx
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Box, Typography, Button, CircularProgress, Alert, Paper } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';

const fetchActiveShift = async () => {
  const { data } = await api.get('/shifts/active/me');
  return data;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: activeShift, isLoading, isError, error } = useQuery({
    queryKey: ['activeShiftCheck'],
    queryFn: fetchActiveShift,
    retry: (failureCount, error) => {
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 2; 
    },
    refetchOnWindowFocus: false, 
  });

  const renderShiftStatus = () => {
    if (isLoading) {
      return (
        <Box sx={{ mt: 3 }}>
          <CircularProgress />
          <Typography>Checking for active shift...</Typography>
        </Box>
      );
    }

    if (activeShift) {
      return (
        <>
          <AssignmentIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            You have an active shift assigned.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/active-shift')}
            sx={{ mt: 2 }}
          >
            Access Active Shift (ID: {activeShift.id})
          </Button>
        </>
      );
    }

    if (isError && error.response?.status === 404) {
      return (
        <>
          <InfoIcon color="info" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No active shift is currently assigned to you.
          </Typography>
          <Typography color="text.secondary">
            You can browse the system catalogs using the menu above.
          </Typography>
        </>
      );
    }
    
    if (isError) {
      return <Alert severity="error">Error checking shift status: {error.message}</Alert>;
    }

    return null;
  };

  return (
    <Paper 
      sx={{ 
        p: 4, 
        textAlign: 'center', 
        minHeight: '300px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.username}
      </Typography>
      {renderShiftStatus()}
    </Paper>
  );
};

export default DashboardPage;