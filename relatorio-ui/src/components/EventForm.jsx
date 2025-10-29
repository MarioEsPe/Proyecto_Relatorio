// relatorio-ui/src/components/EventForm.jsx
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

const eventTypes = [
  "PROTECTION_TRIP",
  "FORCED_OUTAGE",
  "LOAD_REDUCTION",
  "UNIT_SYNCHRONIZATION",
  "UNIT_SHUTDOWN",
  "ROUTINE_TEST",
  "OTHER"
];

const EventForm = ({ onSubmit, isLoading, error }) => {
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('OTHER');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description) return;
    
    onSubmit({
      description,
      event_type: eventType,
      timestamp: new Date().toISOString() 
    }, {
      onSuccess: () => {
        setDescription('');
        setEventType('OTHER');
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
        <Typography variant="body1" fontWeight="bold">Log New Event</Typography>
        
        <FormControl fullWidth required>
          <InputLabel id="event-type-label">Event Type</InputLabel>
          <Select
            labelId="event-type-label"
            value={eventType}
            label="Event Type"
            onChange={(e) => setEventType(e.target.value)}
            disabled={isLoading}
          >
            {eventTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type.replace("_", " ")} 
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="Description / Details"
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
            Failed to log event: {error.message}
          </Alert>
        )}
        
        <Button 
          type="submit" 
          variant="contained" 
          disabled={isLoading || !description}
        >
          {isLoading ? 'Logging...' : 'Log Event'}
        </Button>
      </Stack>
    </Box>
  );
};

export default EventForm;