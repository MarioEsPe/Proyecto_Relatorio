// relatorio-ui/src/pages/ReportViewerPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

const fetchReportDetails = async (reportId) => {
  const { data } = await api.get(`/reports/${reportId}`);
  return data;
};

const ReportViewerPage = () => {
  const { reportId } = useParams(); 

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reportDetails', reportId],
    queryFn: () => fetchReportDetails(reportId),
    retry: 1, 
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Report...
        </Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
        <Typography variant="h6">Error Loading Report</Typography>
        Details: {error.response?.data?.detail || error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Shift Report Archive
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Report ID: {report.id} (Shift {report.shift_designator})
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          **Operational Date:** {report.shift_date}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          **Start:** {new Date(report.start_time).toLocaleString()} | **End:**{' '}
          {new Date(report.end_time).toLocaleString()}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          {/* Columna de Eventos */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Event Log</Typography>
            <List dense>
              {report.event_logs.length === 0 ? (
                <Typography sx={{ fontStyle: 'italic' }}>No events logged.</Typography>
              ) : (
                report.event_logs.map((log) => (
                  <ListItem key={log.id} divider>
                    <ListItemText
                      primary={`[${log.event_type}] ${log.description}`}
                      secondary={`Time: ${new Date(log.timestamp).toLocaleTimeString()}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Grid>

          {/* Columna de Novedades */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Novelties & Instructions</Typography>
            <List dense>
              {report.novelty_logs.length === 0 ? (
                <Typography sx={{ fontStyle: 'italic' }}>No novelties logged.</Typography>
              ) : (
                report.novelty_logs.map((log) => (
                  <ListItem key={log.id} divider>
                    <ListItemText
                      primary={`[${log.novelty_type}] ${log.description}`}
                      secondary={`By: ${log.user.username} at ${new Date(log.timestamp).toLocaleTimeString()}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Grid>
          
          {/* Columna de Tareas Completadas */}
          <Grid item xs={12}>
             <Typography variant="h6" sx={{mt: 2}}>Completed Tasks</Typography>
             <List dense>
              {report.task_logs.length === 0 ? (
                <Typography sx={{ fontStyle: 'italic' }}>No tasks logged.</Typography>
              ) : (
                report.task_logs.map((log) => (
                  <ListItem key={log.id} divider>
                    <ListItemText
                      primary={log.scheduled_task.name}
                      secondary={`Completed by: ${log.user.username} at ${new Date(log.completion_time).toLocaleTimeString()}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Grid>
          
          {/* TODO: Se pueden añadir más paneles de solo lectura para otros logs (Equipment, Tanks, etc.) */}
          
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportViewerPage;