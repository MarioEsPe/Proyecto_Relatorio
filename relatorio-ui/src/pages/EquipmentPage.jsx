// relatorio-ui/src/pages/EquipmentPage.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api'; // Importamos nuestra instancia de Axios

// Importar componentes de MUI
import {
  Typography,
  Box,
  CircularProgress, // Spinner de carga
  Alert,              // Mensaje de error
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

// 1. Definimos la función de 'fetch'
// Esta es la función que React Query llamará.
// Debe devolver una promesa (Axios ya lo hace).
const fetchEquipment = async () => {
  const { data } = await api.get('/equipment');
  return data;
};

const EquipmentPage = () => {
  // 2. Usamos el hook useQuery
  const { 
    data: equipmentList, // Renombramos 'data' a 'equipmentList'
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['equipment'], // Esta es la "llave" única para este query
    queryFn: fetchEquipment   // Esta es la función que se ejecutará
  });

  // 3. Manejar el estado de Carga
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 4. Manejar el estado de Error
  if (isError) {
    return (
      <Alert severity="error">
        Error fetching equipment: {error.message}
      </Alert>
    );
  }

  // 5. Renderizar los datos (Estado Exitoso)
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Equipment Catalog Management
      </Typography>
      
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
    </Box>
  );
};

export default EquipmentPage;