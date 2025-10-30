// relatorio-ui/src/components/PositionsPanel.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

import PositionFormModal from './PositionFormModal';
import ConfirmationDialog from './ConfirmationDialog';

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


const fetchPositions = async () => {
  const { data } = await api.get('/personnel/positions/');
  return data;
};

const createPosition = async (newPosition) => {
  const { data } = await api.post('/personnel/positions/', newPosition);
  return data;
};

const updatePosition = async (positionData) => {
  const { id, ...dataToUpdate } = positionData;
  const { data } = await api.put(`/personnel/positions/${id}`, dataToUpdate);
  return data;
};

const deletePosition = async (positionId) => {
  await api.delete(`/personnel/positions/${positionId}`);
  return positionId;
};

const PositionsPanel = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [positionToEdit, setPositionToEdit] = useState(null); 
  const [positionToDelete, setPositionToDelete] = useState(null); 


  const { 
    data: positions, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['positions'], 
    queryFn: fetchPositions
  });

  const createMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setIsModalOpen(false); 
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setPositionToEdit(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setPositionToDelete(null);
    },
  });

  const handleOpenCreateModal = () => {
    setPositionToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (position) => {
    setPositionToEdit(position);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPositionToEdit(null); 
  };

  const handleOpenDeleteDialog = (position) => {
    setPositionToDelete(position);
  };
  
  const handleCloseDeleteDialog = () => {
    setPositionToDelete(null);
  };

  const handleSubmit = (formData) => {
    if (positionToEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const handleDeleteConfirm = () => {
    deleteMutation.mutate(positionToDelete.id);
  };

  if (isLoading) {
    return <CircularProgress />;
  }
  if (isError) {
    return <Alert severity="error">Error fetching positions: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Job Positions</Typography>
        <Button variant="contained" onClick={handleOpenCreateModal}>
          Add New Position
        </Button>
      </Box>

      {/* Positions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((pos) => (
              <TableRow key={pos.id}>
                <TableCell>{pos.id}</TableCell>
                <TableCell>{pos.name}</TableCell>
                <TableCell>{pos.description || 'N/A'}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenEditModal(pos)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleOpenDeleteDialog(pos)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Modal */}
      <PositionFormModal 
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={createMutation.isLoading || updateMutation.isLoading}
        initialData={positionToEdit}
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(positionToDelete)}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Position"
        description={`Are you sure you want to delete "${positionToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      />
    </Box>
  );
};

export default PositionsPanel;