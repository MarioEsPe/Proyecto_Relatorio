// relatorio-ui/src/pages/ActiveShiftPage.jsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

import NoveltyForm from '../components/NoveltyForm';
import EventForm from '../components/EventForm';
import EquipmentStatusPanel from '../components/EquipmentStatusPanel';

import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Paper,
  Grid 
} from '@mui/material';


const fetchActiveShift = async () => {
  const { data } = await api.get('/shifts/active/me');
  return data; 
};

const createNoveltyLog = async ({ shiftId, noveltyData }) => {
  const { data } = await api.post(`/shifts/${shiftId}/novelties/`, noveltyData);
  return data;
};

const createEventLog = async ({ shiftId, eventData }) => {
  const { data } = await api.post(`/shifts/${shiftId}/events/`, eventData);
  return data;
};

const ActiveShiftPage = () => {
  const queryClient = useQueryClient();
  
  const { 
    data: activeShift, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ['activeShift'], 
    queryFn: fetchActiveShift,
    refetchOnWindowFocus: false, 
    retry: (failureCount, error) => {
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 3; 
    }
  });

  const noveltyMutation = useMutation({
    mutationFn: createNoveltyLog, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
    onError: (error) => {
      console.error("Failed to create novelty:", error);
    }
  });

  const eventMutation = useMutation({
    mutationFn: createEventLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
    onError: (error) => {
      console.error("Failed to create event:", error);
    }
  });
  
  const handleNoveltySubmit = (noveltyData, formOptions) => {
    noveltyMutation.mutate({
      shiftId: activeShift.id,
      noveltyData: noveltyData
    }, formOptions); 
  };

  const handleEventSubmit = (eventData, formOptions) => {
    eventMutation.mutate({
      shiftId: activeShift.id,
      eventData: eventData
    }, formOptions);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Active Shift Data...
        </Typography>
      </Box>
    );
  }

  if (isError) {
    if (error.response?.status === 404) {
      return (
        <Alert severity="info" variant="outlined" sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
          <Typography variant="h6">No Active Shift Found</Typography>
          You are successfully logged in, but you have not been assigned an active shift yet.
          <br />
          Please wait for the Outgoing Superintendent to complete the handover.
        </Alert>
      );
    }
    
    return (
      <Alert severity="error" sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
        <Typography variant="h6">Error Loading Shift</Typography>
        Could not fetch shift data. Details: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Active Shift Dashboard (Shift ID: {activeShift.id})
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Shift Start: {new Date(activeShift.start_time).toLocaleString()}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        
        {/* Columna de Eventos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, minHeight: 300 }}>
            <Typography variant="h6">Event Log</Typography>
            {activeShift.event_logs.length === 0 ? (
              <Typography sx={{ mt: 2, fontStyle: 'italic' }}>No events logged for this shift yet.</Typography>
            ) : (
              <ul>
                {activeShift.event_logs.map(log => (
                  <li key={log.id}>
                    <strong>[{log.event_type}]</strong>: {log.description} 
                    <em> ({new Date(log.timestamp).toLocaleTimeString()})</em>
                  </li>
                ))}
              </ul>
            )}

            <EventForm
              onSubmit={handleEventSubmit}
              isLoading={eventMutation.isLoading}
              error={eventMutation.error}
            />
          </Paper>
        </Grid>

        {/* Columna de Novedades */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, minHeight: 300 }}>
            <Typography variant="h6">Novelties & Instructions</Typography>
            {activeShift.novelty_logs.length === 0 ? (
              <Typography sx={{ mt: 2, fontStyle: 'italic' }}>No novelties logged for this shift yet.</Typography>
            ) : (
              <ul>
                {activeShift.novelty_logs.map(log => (
                  <li key={log.id}>
                    <strong>[{log.novelty_type}]</strong>: {log.description}
                    <em> ({new Date(log.timestamp).toLocaleTimeString()} by {log.user.username})</em>
                  </li>
                ))}
              </ul>
            )}

            <NoveltyForm 
              onSubmit={handleNoveltySubmit}
              isLoading={noveltyMutation.isLoading}
              error={noveltyMutation.error}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <EquipmentStatusPanel shiftId={activeShift.id} />
        </Grid>
                
      </Grid>
    </Box>
  );
};

export default ActiveShiftPage;