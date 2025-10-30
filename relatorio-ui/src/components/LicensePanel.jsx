// relatorio-ui/src/components/LicensePanel.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';


const fetchActiveLicenses = async () => {
  const { data } = await api.get('/licenses/', { params: { status: 'ACTIVE' } });
  return data;
};

const createLicense = async (newLicense) => {
  const payload = {
    ...newLicense,
    start_time: new Date().toISOString()
  };
  const { data } = await api.post('/licenses/', payload);
  return data;
};

const closeLicense = async (licenseId) => {
  const payload = {
    end_time: new Date().toISOString()
  };
  const { data } = await api.put(`/licenses/${licenseId}/close`, payload);
  return data;
};


const LicensePanel = () => {
  const queryClient = useQueryClient();
  
  const [formState, setFormState] = useState({
    license_number: '',
    affected_unit: '',
    description: ''
  });

  const { 
    data: activeLicenses, 
    isLoading: isLoadingLicenses 
  } = useQuery({
    queryKey: ['activeLicenses'], 
    queryFn: fetchActiveLicenses
  });

  const createMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLicenses'] });
      setFormState({
        license_number: '',
        affected_unit: '',
        description: ''
      });
    }
  });

  const closeMutation = useMutation({
    mutationFn: closeLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLicenses'] });
    }
  });

  const handleFormChange = (e) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formState);
  };

  const handleCloseLicense = (licenseId) => {
    closeMutation.mutate(licenseId);
  };

  if (isLoadingLicenses) {
    return (
      <Paper sx={{ p: 2, mt: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        CENACE Licenses Management
      </Typography>
      
      {/* --- 1. Form for New License --- */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <Typography variant="body1" fontWeight="bold">Open New License</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              name="license_number"
              label="License Number (Folio)"
              value={formState.license_number}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              name="affected_unit"
              label="Affected Unit / Equipment"
              value={formState.affected_unit}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description of Work"
              value={formState.description}
              onChange={handleFormChange}
              fullWidth
              required
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? "Opening..." : "Open License"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* --- 2. Table of Active Licenses --- */}
      <Typography variant="body1" fontWeight="bold" sx={{ mt: 4 }}>
        Active Licenses
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Affected</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {activeLicenses?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No active licenses found.
                </TableCell>
              </TableRow>
            )}
            {activeLicenses?.map(license => (
              <TableRow key={license.id}>
                <TableCell>{license.license_number}</TableCell>
                <TableCell>{license.affected_unit}</TableCell>
                <TableCell>{license.description}</TableCell>
                <TableCell>{new Date(license.start_time).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleCloseLicense(license.id)}
                    disabled={closeMutation.isLoading}
                  >
                    Close License
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default LicensePanel;