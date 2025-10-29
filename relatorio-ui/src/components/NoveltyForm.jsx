// relatorio-ui/src/components/NoveltyForm.jsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert, 
  Typography
} from '@mui/material';

const noveltyTypes = [
  "GENERAL",
  "SPECIAL_INSTRUCTION",
  "SAFETY_INCIDENT",
  "ENVIRONMENTAL_INCIDENT"
];

const NoveltyForm = ({ onSubmit, isLoading, error }) => {
  const [description, setDescription] = useState('');
  const [noveltyType, setNoveltyType] = useState('GENERAL');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description) return;
    
    onSubmit({
      description,
      novelty_type: noveltyType
    }, {
      onSuccess: () => {
        setDescription('');
        setNoveltyType('GENERAL');
      }
    });
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        border: '1px solid', 
        borderColor: 'divider', 
        p: 2, 
        borderRadius: 1,
        mt: 2 
      }}
    >
      <Stack spacing={2}>
        <Typography variant="body1" fontWeight="bold">Log New Novelty</Typography>
        
        <FormControl fullWidth required>
          <InputLabel id="novelty-type-label">Novelty Type</InputLabel>
          <Select
            labelId="novelty-type-label"
            value={noveltyType}
            label="Novelty Type"
            onChange={(e) => setNoveltyType(e.target.value)}
            disabled={isLoading}
          >
            {noveltyTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type.replace("_", " ")} 
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="Description"
          multiline
          rows={3}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isLoading}
        />
        
        {error && (
          <Alert severity="error">
            Failed to log novelty: {error.message}
          </Alert>
        )}
        
        <Button 
          type="submit" 
          variant="contained" 
          disabled={isLoading || !description}
        >
          {isLoading ? 'Logging...' : 'Log Novelty'}
        </Button>
      </Stack>
    </Box>
  );
};

export default NoveltyForm;