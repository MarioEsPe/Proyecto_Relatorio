// relatorio-ui/src/components/PositionsPanel.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Importar componentes de MUI
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
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';

// --- Funciones de API para Puestos ---
const fetchPositions = async () => {
  const { data } = await api.get('/personnel/positions/');
  return data;
};

const createPosition = async (newPosition) => {
  const { data } = await api.post('/personnel/positions/', newPosition);
  return data;
};

// --- Componente del Panel ---
const PositionsPanel = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPosition, setNewPosition] = useState({ name: '', description: '' });

  // Query para LEER Puestos
  const { 
    data: positions, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['positions'], // Llave única para este query
    queryFn: fetchPositions
  });

  // Mutación para CREAR Puestos
  const createMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setIsModalOpen(false);
      setNewPosition({ name: '', description: '' }); // Resetear formulario
    },
    // TODO: Manejar onError
  });

  // --- Manejadores de UI ---
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleFormChange = (e) => {
    setNewPosition({ ...newPosition, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(newPosition);
  };

  // --- Renderizado de Estados ---
  if (isLoading) {
    return <CircularProgress />;
  }
  if (isError) {
    return <Alert severity="error">Error fetching positions: {error.message}</Alert>;
  }

  // --- Renderizado Principal ---
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Job Positions</Typography>
        <Button variant="contained" onClick={handleOpenModal}>
          Add New Position
        </Button>
      </Box>

      {/* Tabla de Puestos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((pos) => (
              <TableRow key={pos.id}>
                <TableCell>{pos.id}</TableCell>
                <TableCell>{pos.name}</TableCell>
                <TableCell>{pos.description || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para Crear Puesto */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add New Position</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="Position Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newPosition.name}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={newPosition.description}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} disabled={createMutation.isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Saving...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PositionsPanel;