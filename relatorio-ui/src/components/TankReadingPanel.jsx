// relatorio-ui/src/components/TankReadingPanel.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button
} from '@mui/material';


const fetchTanks = async () => {
  const { data } = await api.get('/tank/');
  return data;
};

const logTankReading = async ({ shiftId, tankId, levelLiters }) => {
  const logData = {
    tank_id: tankId,
    level_liters: levelLiters,
    reading_timestamp: new Date().toISOString()
  };
  const { data } = await api.post(`/shifts/${shiftId}/tank-readings/`, logData);
  return data;
};


const TankRow = ({ tank, shiftId }) => {
  const queryClient = useQueryClient();
  const [level, setLevel] = useState(''); 

  const mutation = useMutation({
    mutationFn: logTankReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      setLevel(''); 
    },
  });

  const handleLevelChange = (e) => {
    setLevel(e.target.value);
  };

  const handleSave = () => {
    const levelLiters = parseFloat(level);
    if (!isNaN(levelLiters)) {
      mutation.mutate({
        shiftId,
        tankId: tank.id,
        levelLiters
      });
    }
  };

  return (
    <TableRow>
      <TableCell>{tank.name}</TableCell>
      <TableCell>{tank.resource_type}</TableCell>
      <TableCell align="right">{tank.capacity_liters.toLocaleString()} L</TableCell>
      <TableCell>
        <TextField
          type="number"
          value={level}
          onChange={handleLevelChange}
          size="small"
          label="Current Level (L)"
          fullWidth
          disabled={mutation.isLoading}
        />
      </TableCell>
      <TableCell align="right">
        <Button
          size="small"
          onClick={handleSave}
          disabled={!level || mutation.isLoading}
          variant="contained"
          color="primary"
        >
          {mutation.isLoading ? 'Saving...' : 'Log'}
        </Button>
      </TableCell>
    </TableRow>
  );
};


const TankReadingPanel = ({ shiftId }) => {
  const { 
    data: tankList, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['tanks'], 
    queryFn: fetchTanks
  });

  if (isLoading) {
    return <CircularProgress />;
  }
  if (isError) {
    return <Alert severity="error">Error fetching tank list: {error.message}</Alert>;
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Resource Tank Levels
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tank Name</TableCell>
              <TableCell>Resource Type</TableCell>
              <TableCell align="right">Total Capacity</TableCell>
              <TableCell>Current Reading</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {tankList.map(tank => (
              <TankRow key={tank.id} tank={tank} shiftId={shiftId} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TankReadingPanel;