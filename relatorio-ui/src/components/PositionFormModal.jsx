// relatorio-ui/src/components/PositionFormModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';

const PositionFormModal = ({ open, onClose, onSubmit, isLoading, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ ...formData, id: initialData.id });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} component="form" onSubmit={handleSubmit} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Position' : 'Create New Position'}</DialogTitle>
      
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          name="name"
          label="Position Name"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <TextField
          margin="dense"
          id="description"
          name="description"
          label="Description (Optional)"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.description}
          onChange={handleChange}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button 
          type="submit" 
          variant="contained"
          disabled={isLoading || !formData.name}
        >
          {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PositionFormModal;