// relatorio-ui/src/components/EmployeeFormModal.jsx
import React, { useState, useEffect } from 'react';
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

// Basado en tu app/enums.py
const employeeTypes = ["PERMANENT", "TEMPORARY"];

const EmployeeFormModal = ({ open, onClose, onSubmit, isLoading, positions, initialData = null }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    rpe: '',
    employee_type: 'PERMANENT',
    base_position_id: ''
  });

  useEffect(() => {
    if (initialData) {
      // Si estamos editando, poblamos el formulario.
      // Aseguramos que el position_id no sea nulo para el <Select>
      setFormData({
        full_name: initialData.full_name || '',
        rpe: initialData.rpe || '',
        employee_type: initialData.employee_type || 'PERMANENT',
        base_position_id: initialData.base_position_id || ''
      });
    } else {
      // Modo "Crear", reseteamos
      setFormData({
        full_name: '',
        rpe: '',
        employee_type: 'PERMANENT',
        base_position_id: ''
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Preparamos los datos; si el base_position_id está vacío, lo enviamos como null
    const dataToSubmit = {
      ...formData,
      base_position_id: formData.base_position_id || null
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={open} onClose={onClose} component="form" onSubmit={handleSubmit} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Employee' : 'Create New Employee'}</DialogTitle>
      
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="full_name"
          name="full_name"
          label="Full Name"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.full_name}
          onChange={handleChange}
          required
        />
        <TextField
          margin="dense"
          id="rpe"
          name="rpe"
          label="RPE (Employee ID)"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.rpe}
          onChange={handleChange}
          required
        />
        <FormControl fullWidth margin="dense" required>
          <InputLabel id="employee-type-label">Employee Type</InputLabel>
          <Select
            labelId="employee-type-label"
            id="employee_type"
            name="employee_type"
            value={formData.employee_type}
            label="Employee Type"
            onChange={handleChange}
          >
            {employeeTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel id="position-label">Base Position (Optional)</InputLabel>
          <Select
            labelId="position-label"
            id="base_position_id"
            name="base_position_id"
            value={formData.base_position_id}
            label="Base Position (Optional)"
            onChange={handleChange}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {positions && positions.map((pos) => (
              <MenuItem key={pos.id} value={pos.id}>
                {pos.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button 
          type="submit" 
          variant="contained"
          disabled={isLoading || !formData.rpe || !formData.full_name}
        >
          {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeFormModal;