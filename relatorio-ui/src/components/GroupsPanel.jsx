// relatorio-ui/src/components/GroupsPanel.jsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import ConfirmationDialog from './ConfirmationDialog';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const fetchGroups = async () => {
  const { data } = await api.get('/personnel/groups/');
  return data;
};
const fetchEmployees = async () => {
  const { data } = await api.get('/personnel/employees/');
  return data;
};
const createGroup = async (newGroup) => {
  const { data } = await api.post('/personnel/groups/', newGroup);
  return data;
};
const deleteGroup = async (groupId) => {
  await api.delete(`/personnel/groups/${groupId}`);
  return groupId;
};
const addMember = async ({ groupId, employeeId }) => {
  const { data } = await api.post(`/personnel/groups/${groupId}/members/${employeeId}`);
  return data;
};
const removeMember = async ({ groupId, employeeId }) => {
  const { data } = await api.delete(`/personnel/groups/${groupId}/members/${employeeId}`);
  return data;
};

const GroupsPanel = () => {
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState('');
  const [employeeToAdd, setEmployeeToAdd] = useState('');
  const [groupToDelete, setGroupToDelete] = useState(null);
  
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups
  });
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees
  });
  
  const assignedEmployeeIds = useMemo(() => {
    if (!groups) return new Set();
    
    const idSet = new Set();
    for (const group of groups) {
      for (const member of group.members) {
        idSet.add(member.id);
      }
    }
    return idSet;
  }, [groups]);

  const availableEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(emp => !assignedEmployeeIds.has(emp.id));
  }, [employees, assignedEmployeeIds]);

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewGroupName('');
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setGroupToDelete(null);
    }
  });
  const addMemberMutation = useMutation({
    mutationFn: addMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setEmployeeToAdd('');
    }
  });
  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  const handleCreateGroup = (e) => {
    e.preventDefault();
    createMutation.mutate({ name: newGroupName });
  };

  const handleAddMember = (groupId) => {
    if (employeeToAdd) {
      addMemberMutation.mutate({ groupId, employeeId: employeeToAdd });
    }
  };

  if (isLoadingGroups || isLoadingEmployees) {
    return <CircularProgress />;
  }

  return (
    <Box>
      {/* 1. Create New Group Form */}
      <Paper component="form" onSubmit={handleCreateGroup} sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="New Group Name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          required
          sx={{ flexGrow: 1 }}
          size="small"
        />
        <Button 
          type="submit" 
          variant="contained"
          disabled={createMutation.isLoading || !newGroupName}
        >
          {createMutation.isLoading ? 'Creating...' : 'Create Group'}
        </Button>
      </Paper>
      
      {/* 2. List of Groups (Accordions) */}
      <Typography variant="h5">Existing Groups</Typography>
      {groups?.length === 0 && <Alert severity="info">No shift groups created yet.</Alert>}
      
      {groups?.map(group => (
        <Accordion key={group.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ flexGrow: 1 }}>{group.name}</Typography>
            <IconButton 
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation(); 
                setGroupToDelete(group);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </AccordionSummary>
          <AccordionDetails sx={{ borderTop: 1, borderColor: 'divider' }}>
            {/* Add Member Form */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={8}>
                <FormControl fullWidth size="small">
                  {/*<InputLabel>Add Employee</InputLabel>*/}
                  <Select
                    value={employeeToAdd}
                    // label="Add Employee"
                    onChange={(e) => setEmployeeToAdd(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>--- Select Employee ---</em>
                    </MenuItem>
                    {availableEmployees.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.rpe})</MenuItem>
                    ))}  
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => handleAddMember(group.id)}
                  disabled={addMemberMutation.isLoading || !employeeToAdd}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
            
            {/* Member List */}
            <Typography variant="body2" fontWeight="bold">Members:</Typography>
            <List dense>
              {group.members.length === 0 && <ListItem><ListItemText primary="No members in this group." /></ListItem>}
              {group.members.map(member => (
                <ListItem key={member.id}>
                  <ListItemText 
                    primary={member.full_name} 
                    secondary={member.rpe} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      size="small"
                      onClick={() => removeMemberMutation.mutate({ groupId: group.id, employeeId: member.id })}
                      disabled={removeMemberMutation.isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Delete Group Dialog */}
      <ConfirmationDialog
        open={Boolean(groupToDelete)}
        onClose={() => setGroupToDelete(null)}
        onConfirm={() => deleteMutation.mutate(groupToDelete.id)}
        title="Delete Shift Group"
        description={`Are you sure you want to delete the group "${groupToDelete?.name}"?`}
        isLoading={deleteMutation.isLoading}
      />
    </Box>
  );
};

export default GroupsPanel;