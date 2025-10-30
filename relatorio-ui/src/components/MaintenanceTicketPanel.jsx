// relatorio-ui/src/components/MaintenanceTicketPanel.jsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const ticketTypes = ["FAULT_REPORT", "PLANNED_MAINTENANCE"];
const ticketStatuses = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED"
};


const fetchTickets = async () => {
  const { data } = await api.get('/maintenance-tickets/');
  return data;
};

const fetchEquipment = async () => {
  const { data } = await api.get('/equipment/');
  return data;
};

const createTicket = async (newTicket) => {
  const { data } = await api.post('/maintenance-tickets/', newTicket);
  return data;
};

const updateTicketStatus = async ({ ticketId, status }) => {
  const payload = { ticket_status: status };
  const { data } = await api.put(`/maintenance-tickets/${ticketId}`, payload);
  return data;
};


const MaintenanceTicketPanel = () => {
  const queryClient = useQueryClient();
  
  const [formState, setFormState] = useState({
    equipment_id: '',
    ticket_type: 'FAULT_REPORT',
    description: '',
    impact: ''
  });

  const { 
    data: tickets, 
    isLoading: isLoadingTickets 
  } = useQuery({
    queryKey: ['maintenanceTickets'],
    queryFn: fetchTickets
  });

  const { 
    data: equipment, 
    isLoading: isLoadingEquipment 
  } = useQuery({
    queryKey: ['equipment'], 
    queryFn: fetchEquipment
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTickets'] });
      setFormState({
        equipment_id: '',
        ticket_type: 'FAULT_REPORT',
        description: '',
        impact: ''
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateTicketStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTickets'] });
    }
  });

  const handleFormChange = (e) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formState);
  };

  const handleMarkCompleted = (ticketId) => {
    updateStatusMutation.mutate({ 
      ticketId, 
      status: ticketStatuses.COMPLETED 
    });
  };

  const openTickets = useMemo(() => {
    return tickets?.filter(t => t.ticket_status !== ticketStatuses.COMPLETED) || [];
  }, [tickets]);
  
  if (isLoadingTickets || isLoadingEquipment) {
    return (
      <Paper sx={{ p: 2, mt: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Defects & Maintenance Tickets
      </Typography>
      
      {/* --- 1. Form for New Defects --- */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <Typography variant="body1" fontWeight="bold">Report New Defect</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="equip-select-label">Equipment</InputLabel>
              <Select
                labelId="equip-select-label"
                name="equipment_id"
                value={formState.equipment_id}
                label="Equipment"
                onChange={handleFormChange}
              >
                {equipment?.map(eq => (
                  <MenuItem key={eq.id} value={eq.id}>{eq.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="type-select-label">Ticket Type</InputLabel>
              <Select
                labelId="type-select-label"
                name="ticket_type"
                value={formState.ticket_type}
                label="Ticket Type"
                onChange={handleFormChange}
              >
                {ticketTypes.map(type => (
                  <MenuItem key={type} value={type}>{type.replace("_", " ")}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description of Defect"
              value={formState.description}
              onChange={handleFormChange}
              fullWidth
              required
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="impact"
              label="Potential Impact (e.g., load reduction)"
              value={formState.impact}
              onChange={handleFormChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? "Saving..." : "Submit New Ticket"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* --- 2. Table of Open Defects --- */}
      <Typography variant="body1" fontWeight="bold" sx={{ mt: 4 }}>
        Open Defects
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Created</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {openTickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No open defects found.
                </TableCell>
              </TableRow>
            )}
            {openTickets.map(ticket => (
              <TableRow key={ticket.id}>
                <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{equipment?.find(e => e.id === ticket.equipment_id)?.name || 'N/A'}</TableCell>
                <TableCell>{ticket.description}</TableCell>
                <TableCell>{ticket.impact || 'N/A'}</TableCell>
                <TableCell>{ticket.ticket_status}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="success"
                    variant="outlined"
                    onClick={() => handleMarkCompleted(ticket.id)}
                    disabled={updateStatusMutation.isLoading}
                  >
                    Mark as Corrected
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

export default MaintenanceTicketPanel;