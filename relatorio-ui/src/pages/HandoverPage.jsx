// relatorio-ui/src/pages/HandoverPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container
} from '@mui/material';

const fetchActiveShift = async () => {
  const { data } = await api.get('/shifts/active/me');
  return data; 
};

const fetchShiftGroups = async () => {
  const { data } = await api.get('/personnel/groups/');
  return data;
};

const performHandover = async (handoverData) => {
  const { data } = await api.post('/shifts/handover', handoverData);
  return data;
};


const HandoverPage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const [formState, setFormState] = useState({
    outgoing_superintendent_password: '',
    incoming_superintendent_username: '',
    incoming_superintendent_password: '',
    next_scheduled_group_id: ''
  });

  const { 
    data: activeShift, 
    isLoading: isLoadingShift,
    isError: isErrorShift
  } = useQuery({
    queryKey: ['activeShift'], 
    queryFn: fetchActiveShift,
    retry: 1
  });

  const { 
    data: groups, 
    isLoading: isLoadingGroups 
  } = useQuery({
    queryKey: ['shiftGroups'],
    queryFn: fetchShiftGroups
  });

  const handoverMutation = useMutation({
    mutationFn: performHandover,
    onSuccess: () => {

      logout();
      navigate('/login');
    },
  });

  const handleFormChange = (e) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handoverMutation.mutate({
      ...formState,
      shift_to_close_id: activeShift.id
    });
  };

  if (isLoadingShift || isLoadingGroups) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isErrorShift) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="h6">No Active Shift</Typography>
          You do not have an active shift to hand over.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Shift Handover
        </Typography>
        <Typography gutterBottom>
          You are about to close **Shift ID: {activeShift.id}**. 
          To proceed, please complete the digital handshake by providing credentials 
          for both the outgoing (yourself) and incoming superintendent.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {/* --- Outgoing (Current User) --- */}
            <Grid item xs={12}>
              <Typography variant="h6">1. Outgoing Superintendent (Your) Confirmation</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="outgoing_superintendent_password"
                label="Your Password"
                type="password"
                value={formState.outgoing_superintendent_password}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            
            {/* --- Incoming User --- */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>2. Incoming Superintendent Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="incoming_superintendent_username"
                label="Incoming User's Username"
                value={formState.incoming_superintendent_username}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="incoming_superintendent_password"
                label="Incoming User's Password"
                type="password"
                value={formState.incoming_superintendent_password}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="group-select-label">Next Scheduled Group</InputLabel>
                <Select
                  labelId="group-select-label"
                  name="next_scheduled_group_id"
                  value={formState.next_scheduled_group_id}
                  label="Next Scheduled Group"
                  onChange={handleFormChange}
                >
                  {groups?.map(group => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* --- Submit --- */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
                disabled={handoverMutation.isLoading}
              >
                {handoverMutation.isLoading ? "Processing Handover..." : "Complete Handover"}
              </Button>
            </Grid>
          </Grid>
          
          {handoverMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Handover Failed: {handoverMutation.error.response?.data?.detail || handoverMutation.error.message}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default HandoverPage;