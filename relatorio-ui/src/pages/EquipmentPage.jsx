// relatorio-ui/src/pages/EquipmentPage.jsx
import React, { useState} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api'; 

import EquipmentFormModal from '../components/EquipmentFormModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

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
  Button,
  IconButton 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const fetchEquipment = async () => {
  const { data } = await api.get('/equipment');
  return data;
};

const createEquipment = async (newEquipment) => {
  const { data } = await api.post('/equipment', newEquipment);
  return data;
};

const updateEquipment = async (equipmentData) => {
  const { id, ...dataToUpdate } = equipmentData;
  const { data } = await api.put(`/equipment/${id}`, dataToUpdate); 
  return data;
};

const deleteEquipment = async (equipmentId) => {
  await api.delete(`/equipment/${equipmentId}`);
  return equipmentId;
};

const EquipmentPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  
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
      setIsCreateModalOpen(false);
    },
    // TODO: manejar onError
  });

  const updateMutation = useMutation({
    mutationFn: updateEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setEquipmentToEdit(null); // Cierra el modal de edición
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setEquipmentToDelete(null); // Cierra el modal de confirmación
    },
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
          onClick={() => setIsCreateModalOpen(true)}
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
              <TableCell align="right">Actions</TableCell>
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
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    onClick={() => setEquipmentToEdit(equipment)}
                    disabled={updateMutation.isLoading}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setEquipmentToDelete(equipment)}
                    disabled={deleteMutation.isLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EquipmentFormModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createMutation.mutate} 
        isLoading={createMutation.isLoading} 
      />

      <EquipmentFormModal
        open={Boolean(equipmentToEdit)}
        onClose={() => setEquipmentToEdit(null)}
        onSubmit={updateMutation.mutate}
        isLoading={updateMutation.isLoading}
        initialData={equipmentToEdit}
      />

      <ConfirmationDialog
        open={Boolean(equipmentToDelete)}
        onClose={() => setEquipmentToDelete(null)}
        onConfirm={() => deleteMutation.mutate(equipmentToDelete.id)}
        title="Delete Equipment"
        description={`Are you sure you want to delete "${equipmentToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      />      

    </Box>
  );
};

export default EquipmentPage;