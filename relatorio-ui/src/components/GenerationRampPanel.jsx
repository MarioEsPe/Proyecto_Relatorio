// relatorio-ui/src/components/GenerationRampPanel.jsx
import React, { useState, useMemo } from 'react';
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
  Chip,
} from '@mui/material';

const logGenerationRamp = async ({ shiftId, rampData }) => {
  const { data } = await api.post(`/shifts/${shiftId}/ramps/`, rampData);
  return data;
};


const GenerationRampPanel = ({ shiftId, activeShiftData }) => {
  const queryClient = useQueryClient();
  
  const [formState, setFormState] = useState({
    cenace_operator_name: '',
    start_time: '',
    end_time: '',
    initial_load_mw: '',
    final_load_mw: '',
    target_ramp_rate_mw_per_minute: '',
    non_compliance_reason: ''
  });

  const createMutation = useMutation({
    mutationFn: logGenerationRamp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      setFormState({
        cenace_operator_name: '',
        start_time: '',
        end_time: '',
        initial_load_mw: '',
        final_load_mw: '',
        target_ramp_rate_mw_per_minute: '',
        non_compliance_reason: ''
      });
    }
  });

  const handleFormChange = (e) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formState,
      initial_load_mw: parseFloat(formState.initial_load_mw),
      final_load_mw: parseFloat(formState.final_load_mw),
      target_ramp_rate_mw_per_minute: parseFloat(formState.target_ramp_rate_mw_per_minute),
      non_compliance_reason: formState.non_compliance_reason || null
    };
    createMutation.mutate({ shiftId, rampData: payload });
  };

  const loggedRamps = useMemo(() => {
    return activeShiftData.generation_ramps || [];
  }, [activeShiftData.generation_ramps]);


  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Generation Ramps (Self-Assessment)
      </Typography>
      
      {/* --- 1. Form for New Ramp --- */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <Typography variant="body1" fontWeight="bold">Log New CENACE Ramp</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              name="cenace_operator_name"
              label="CENACE Operator Name"
              value={formState.cenace_operator_name}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="start_time"
              label="Instruction Start Time"
              type="datetime-local"
              value={formState.start_time}
              onChange={handleFormChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="end_time"
              label="Adjustment End Time"
              type="datetime-local"
              value={formState.end_time}
              onChange={handleFormChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="initial_load_mw"
              label="Initial Load (MW)"
              type="number"
              value={formState.initial_load_mw}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="final_load_mw"
              label="Final Load (MW)"
              type="number"
              value={formState.final_load_mw}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="target_ramp_rate_mw_per_minute"
              label="Target Ramp (MW/min)"
              type="number"
              value={formState.target_ramp_rate_mw_per_minute}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
           <Grid item xs={12}>
            <TextField
              name="non_compliance_reason"
              label="Reason for Non-Compliance (if any)"
              value={formState.non_compliance_reason}
              onChange={handleFormChange}
              fullWidth
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
              {createMutation.isLoading ? "Logging..." : "Log Ramp"}
            </Button>
          </Grid>
        </Grid>
        {createMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to log ramp: {createMutation.error.message}
          </Alert>
        )}
      </Box>

      {/* --- 2. Table of Logged Ramps --- */}
      <Typography variant="body1" fontWeight="bold" sx={{ mt: 4 }}>
        Logged Ramps (This Shift)
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Compliance</TableCell>
              <TableCell>Operator</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Loads (MW)</TableCell>
              <TableCell>Target (MW/min)</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loggedRamps.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No ramps logged for this shift yet.
                </TableCell>
              </TableRow>
            )}
            {loggedRamps.map(ramp => (
              <TableRow key={ramp.id}>
                <TableCell>
                  <Chip
                    label={ramp.is_compliant ? "Complied" : "Not Complied"}
                    color={ramp.is_compliant ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{ramp.cenace_operator_name}</TableCell>
                <TableCell>{new Date(ramp.start_time).toLocaleTimeString()}</TableCell>
                <TableCell>{new Date(ramp.end_time).toLocaleTimeString()}</TableCell>
                <TableCell>{ramp.initial_load_mw} &rarr; {ramp.final_load_mw}</TableCell>
                <TableCell>{ramp.target_ramp_rate_mw_per_minute}</TableCell>
                <TableCell>{ramp.non_compliance_reason || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default GenerationRampPanel;