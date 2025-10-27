// relatorio-ui/src/pages/EquipmentPage.jsx
import React, { useState} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api'; 

import EquipmentFormModal from '../components/EquipmentFormModal';

import {
  Typography,
  Box,
  CircularProgress, 
  Alert,              
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper, 
  Button 
} from '@mui/material';

const fetchEquipment = async () => {
  const { data } = await api.get('/equipment');
  return data;
};
const createEquipment = async (newEquipment) => {
  const { data } = await api.post('/equipment', newEquipment);
  return data;
};

const EquipmentPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient =useQueryClient();
  const { 
    data: equipmentList, 
    isLoading: isLoadingQuery, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['equipment'], 
    queryFn: fetchEquipment   
  });

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("Error creating equipment:", error);
    }
  });

  if (isLoadingQuery) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError) {
    return (
      <Alert severity="error">
        Error fetching equipment: {error.message}
      </Alert>
    );
  }
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>  
        <Typography variant="h4" gutterBottom>
          Equipment Catalog Management
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setIsModalOpen(true)}
        >
          Add New Equipment
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="equipment table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason for Unavailability</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipmentList && equipmentList.map((equipment) => (
              <TableRow key={equipment.id}>
                <TableCell>{equipment.id}</TableCell>
                <TableCell>{equipment.name}</TableCell>
                <TableCell>{equipment.location}</TableCell>
                <TableCell>{equipment.status}</TableCell>
                <TableCell>{equipment.unavailability_reason || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <EquipmentFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createMutation.mutate} 
        isLoading={createMutation.isLoading} 
      />
    </Box>
  );
};

export default EquipmentPage;