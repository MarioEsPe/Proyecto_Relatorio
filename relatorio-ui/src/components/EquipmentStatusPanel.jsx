// relatorio-ui/src/components/EquipmentStatusPanel.jsx
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
  Select,
  MenuItem,
  TextField,
  Button
} from '@mui/material';

const equipmentStatuses = [
  "IN_SERVICE",
  "AVAILABLE",
  "OUT_OF_SERVICE"
];

const fetchEquipment = async () => {
  const { data } = await api.get('/equipment/');
  return data;
};

const logEquipmentStatus = async ({ shiftId, equipmentId, status, reason }) => {
  const logData = {
    equipment_id: equipmentId,
    status: status,
    reason: reason || null,
    timestamp: new Date().toISOString() 
  };
  const { data } = await api.post(`/shifts/${shiftId}/equipment-status/`, logData);
  return data;
};

const EquipmentRow = ({ equipment, shiftId }) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(equipment.status);
  const [reason, setReason] = useState(equipment.unavailability_reason || '');

  const mutation = useMutation({
    mutationFn: logEquipmentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
  });

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleSave = () => {
    mutation.mutate({
      shiftId,
      equipmentId: equipment.id,
      status,
      reason: status === 'OUT_OF_SERVICE' ? reason : null
    });
  };

  const isChanged = status !== equipment.status || reason !== (equipment.unavailability_reason || '');

  return (
    <TableRow>
      <TableCell>{equipment.name}</TableCell>
      <TableCell>
        <Select
          value={status}
          onChange={handleStatusChange}
          size="small"
          fullWidth
        >
          {equipmentStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </TableCell>
      <TableCell>
        <TextField
          value={reason}
          onChange={handleReasonChange}
          size="small"
          fullWidth
          disabled={status !== 'OUT_OF_SERVICE'}
          placeholder="Reason if Out of Service"
        />
      </TableCell>
      <TableCell align="right">
        <Button
          size="small"
          onClick={handleSave}
          disabled={!isChanged || mutation.isLoading}
          variant={isChanged ? "contained" : "text"}
        >
          {mutation.isLoading ? 'Saving...' : 'Save'}
        </Button>
      </TableCell>
    </TableRow>
  );
};

const EquipmentStatusPanel = ({ shiftId }) => {
  const { 
    data: equipmentList, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['equipment'], 
    queryFn: fetchEquipment
  });

  if (isLoading) {
    return <CircularProgress />;
  }
  if (isError) {
    return <Alert severity="error">Error fetching equipment: {error.message}</Alert>;
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Main Equipment Status
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Equipment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {equipmentList.map(eq => (
              <EquipmentRow key={eq.id} equipment={eq} shiftId={shiftId} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default EquipmentStatusPanel;