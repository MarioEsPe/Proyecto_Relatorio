// relatorio-ui/src/components/EmployeesPanel.jsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

import EmployeeFormModal from './EmployeeFormModal';
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

// --- Funciones de API para Empleados ---
const fetchEmployees = async () => {
  const { data } = await api.get('/personnel/employees/');
  return data;
};
const fetchPositions = async () => {
  const { data } = await api.get('/personnel/positions/');
  return data;
};
const createEmployee = async (newEmployee) => {
  const { data } = await api.post('/personnel/employees/', newEmployee);
  return data;
};
// Nota: El backend para "update" y "delete" de empleados no está en el código,
// así que los omitiremos por ahora. Solo implementaremos 'Create' y 'Read'.
// Cuando los añadas al backend, puedes seguir el mismo patrón de EquipmentPage.

const EmployeesPanel = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- QUERIES ---
  // Query para LEER Empleados
  const { 
    data: employees, 
    isLoading: isLoadingEmployees, 
    isError: isErrorEmployees, 
    error: errorEmployees 
  } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees
  });

  // Query para LEER Puestos (para el formulario)
  const { 
    data: positions, 
    isLoading: isLoadingPositions,
  } = useQuery({
    queryKey: ['positions'], // Misma llave que en PositionsPanel
    queryFn: fetchPositions
  });
  
  // --- MUTACIONES ---
  // Mutación para CREAR Empleados
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
    },
    // TODO: Manejar onError
  });

  // Creamos un "map" (diccionario) para buscar nombres de puestos por ID.
  // 'useMemo' asegura que esto no se recalcule en cada render.
  const positionsMap = useMemo(() => {
    if (!positions) return new Map();
    return new Map(positions.map(pos => [pos.id, pos.name]));
  }, [positions]);

  // --- Renderizado de Estados ---
  if (isLoadingEmployees || isLoadingPositions) {
    return <CircularProgress />;
  }
  if (isErrorEmployees) {
    return <Alert severity="error">Error fetching employees: {errorEmployees.message}</Alert>;
  }

  // --- Renderizado Principal ---
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Employees</Typography>
        <Button variant="contained" onClick={() => setIsModalOpen(true)}>
          Add New Employee
        </Button>
      </Box>

      {/* Tabla de Empleados */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>RPE</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Base Position</TableCell>
              {/* <TableCell align="right">Actions</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>{emp.rpe}</TableCell>
                <TableCell>{emp.full_name}</TableCell>
                <TableCell>{emp.employee_type}</TableCell>
                <TableCell>
                  {/* Usamos el map para mostrar el nombre, no el ID */}
                  {positionsMap.get(emp.base_position_id) || 'N/A'}
                </TableCell>
                {/* <TableCell align="right">
                  <IconButton size="small"><EditIcon /></IconButton>
                  <IconButton size="small" color="error"><DeleteIcon /></IconButton>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para Crear/Editar Empleado */}
      {/* Solo mostramos el modal si los 'positions' ya cargaron */}
      {!isLoadingPositions && (
        <EmployeeFormModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={createMutation.mutate}
          isLoading={createMutation.isLoading}
          positions={positions}
        />
      )}
    </Box>
  );
};

export default EmployeesPanel;