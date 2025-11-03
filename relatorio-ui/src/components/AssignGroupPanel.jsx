// relatorio-ui/src/components/AssignGroupPanel.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

const fetchShiftGroups = async () => {
  const { data } = await api.get('/personnel/groups/');
  return data;
};

const assignGroupToShift = async ({ shiftId, groupId }) => {
  const { data } = await api.post(`/shifts/${shiftId}/assign-group`, {
    group_id: groupId,
  });
  return data;
};

const AssignGroupPanel = ({ shiftId }) => {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const {
    data: groups,
    isLoading: isLoadingGroups,
    isError: isErrorGroups,
    error: errorGroups,
  } = useQuery({
    queryKey: ['shiftGroups'],
    queryFn: fetchShiftGroups,
  });

  const mutation = useMutation({
    mutationFn: assignGroupToShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    mutation.mutate({ shiftId, groupId: selectedGroupId });
  };

  if (isLoadingGroups) {
    return (
      <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 1 }}>Loading Shift Groups...</Typography>
      </Paper>
    );
  }

  if (isErrorGroups) {
    return (
      <Alert severity="error">
        Error loading groups: {errorGroups.message}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3, backgroundColor: 'warning.light' }}>
      <Typography variant="h6" gutterBottom>
        1. Assign Work Group
      </Typography>
      <Typography variant="body1" gutterBottom>
        No work group has been assigned to this shift. Please select the
        group on duty to generate the attendance sheet.
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ mt: 2, display: 'flex', gap: 2 }}
      >
        <FormControl fullWidth>
          <InputLabel id="group-select-label">Select Group</InputLabel>
          <Select
            labelId="group-select-label"
            value={selectedGroupId}
            label="Select Group"
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={mutation.isLoading}
          >
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          disabled={!selectedGroupId || mutation.isLoading}
          sx={{ minWidth: 150 }}
        >
          {mutation.isLoading ? 'Assigning...' : 'Confirm Group'}
        </Button>
      </Box>
      {mutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to assign group:{' '}
          {mutation.error.response?.data?.detail || mutation.error.message}
        </Alert>
      )}
    </Paper>
  );
};

export default AssignGroupPanel;