// relatorio-ui/src/pages/DashboardPage.jsx
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
 } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';
import ArchiveIcon from '@mui/icons-material/Archive';

const fetchActiveShift = async () => {
  const { data } = await api.get('/shifts/active/me');
  return data;
};

const fetchClosedReports = async () => {
  const { data } = await api.get('/reports/', { params: { limit: 25 } }); // Obtener los 25 más nuevos
  return data;
};

const PastReportsList = () => {
  const navigate = useNavigate();
  const {
    data: reports,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['closedReports'],
    queryFn: fetchClosedReports,
  });

  if (isLoading) {
    return <CircularProgress size={24} />;
  }
  if (isError) {
    return <Alert severity="warning">Could not load past reports: {error.message}</Alert>;
  }
  if (!reports || reports.length === 0) {
    return <Typography>No closed reports found in the archive.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Op. Date</TableCell>
            <TableCell>Shift</TableCell>
            <TableCell>Closed At</TableCell>
            <TableCell>Group</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id} hover>
              <TableCell>{report.shift_date}</TableCell>
              <TableCell>Shift {report.shift_designator}</TableCell>
              <TableCell>
                {new Date(report.end_time).toLocaleString()}
              </TableCell>
              <TableCell>
                {report.scheduled_group?.name || 'N/A'}
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { 
    data: activeShift, 
    isLoading, 
    isError, 
    error, 
  } = useQuery({
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
    <Box>
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
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ArchiveIcon color="action" sx={{ mr: 1 }} />
          <Typography variant="h5">
            Past Report Archive
          </Typography>
        </Box>
        <PastReportsList />
      </Paper>
    </Box>
  );
};

export default DashboardPage;