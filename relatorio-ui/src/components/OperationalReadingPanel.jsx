// relatorio-ui/src/components/OperationalReadingPanel.jsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';


const fetchParameters = async () => {
  const { data } = await api.get('/operational-parameters/', { params: { is_active: true } });
  return data;
};

const fetchEquipment = async () => {
  const { data } = await api.get('/equipment/');
  return data;
};

const logOperationalReading = async ({ shiftId, parameterId, equipmentId, value }) => {
  const logData = {
    parameter_id: parameterId,
    equipment_id: equipmentId,
    value: value,
    timestamp: new Date().toISOString()
  };
  const { data } = await api.post(`/shifts/${shiftId}/operational-readings/`, logData);
  return data;
};

const OperationalReadingPanel = ({ shiftId }) => {
  const queryClient = useQueryClient();
  
  const [parameterId, setParameterId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [value, setValue] = useState('');

  const { 
    data: parameters, 
    isLoading: isLoadingParams, 
  } = useQuery({
    queryKey: ['operationalParameters'],
    queryFn: fetchParameters
  });

  const { 
    data: equipment, 
    isLoading: isLoadingEquip, 
  } = useQuery({
    queryKey: ['equipment'], 
    queryFn: fetchEquipment
  });

  const mutation = useMutation({
    mutationFn: logOperationalReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      setParameterId('');
      setEquipmentId('');
      setValue('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericValue = parseFloat(value);
    if (parameterId && equipmentId && !isNaN(numericValue)) {
      mutation.mutate({
        shiftId,
        parameterId,
        equipmentId,
        value: numericValue
      });
    }
  };


  if (isLoadingParams || isLoadingEquip) {
    return (
      <Paper sx={{ p: 2, mt: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading operational data...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Log Operational Conditions
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Selector de Parámetro */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel id="param-select-label">Parameter</InputLabel>
              <Select
                labelId="param-select-label"
                value={parameterId}
                label="Parameter"
                onChange={(e) => setParameterId(e.target.value)}
                disabled={mutation.isLoading}
              >
                {parameters?.map(param => (
                  <MenuItem key={param.id} value={param.id}>
                    {param.name} ({param.unit})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Selector de Equipo */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel id="equip-select-label">Equipment</InputLabel>
              <Select
                labelId="equip-select-label"
                value={equipmentId}
                label="Equipment"
                onChange={(e) => setEquipmentId(e.target.value)}
                disabled={mutation.isLoading}
              >
                {equipment?.map(eq => (
                  <MenuItem key={eq.id} value={eq.id}>
                    {eq.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Campo de Valor */}
          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              label="Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
              required
              disabled={mutation.isLoading}
            />
          </Grid>
          
          {/* Botón de Envío */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={mutation.isLoading || !parameterId || !equipmentId || !value}
            >
              {mutation.isLoading ? 'Saving...' : 'Log Parameter Reading'}
            </Button>
          </Grid>
        </Grid>
        
        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to log reading: {mutation.error.message}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

export default OperationalReadingPanel;