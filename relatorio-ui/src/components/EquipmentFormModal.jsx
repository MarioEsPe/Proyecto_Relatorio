// relatorio-ui/src/components/EquipmentFormModal.jsx
import React, { useState, useEffect } from 'react';

// Importar componentes de MUI
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';

// Definimos los estados de los equipos, basados en tu app/enums.py
const equipmentStatuses = [
  "IN_SERVICE",
  "AVAILABLE",
  "OUT_OF_SERVICE"
];

const EquipmentFormModal = ({ open, onClose, onSubmit, isLoading, initialData = null }) => {
  // Estado interno del formulario
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'AVAILABLE',
    unavailability_reason: ''
  });

  // Efecto para poblar el formulario si estamos en modo "Editar"
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Si no hay data inicial (modo "Crear"), reseteamos
      setFormData({
        name: '',
        location: '',
        status: 'AVAILABLE',
        unavailability_reason: ''
      });
    }
  }, [initialData, open]);

  // Manejador de cambios genérico
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejador del envío
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Llama a la mutación que nos pasaron por props
  };

  return (
    <Dialog open={open} onClose={onClose} component="form" onSubmit={handleSubmit} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Equipment' : 'Create New Equipment'}</DialogTitle>
      
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          name="name"
          label="Equipment Name"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <TextField
          margin="dense"
          id="location"
          name="location"
          label="Location"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.location}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="dense" required>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            name="status"
            value={formData.status}
            label="Status"
            onChange={handleChange}
          >
            {equipmentStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          id="unavailability_reason"
          name="unavailability_reason"
          label="Reason for Unavailability (if any)"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.unavailability_reason}
          onChange={handleChange}
          // Opcional: deshabilitar si el estado no es 'OUT_OF_SERVICE'
          disabled={formData.status !== 'OUT_OF_SERVICE'}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button 
          type="submit" 
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentFormModal;