// relatorio-ui/src/components/TaskLoggingPanel.jsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';


const fetchScheduledTasks = async () => {
  const { data } = await api.get('/scheduled-tasks/', { params: { is_active: true } });
  return data;
};

const logTaskCompletion = async ({ shiftId, taskId }) => {
  const logData = {
    scheduled_task_id: taskId,
    completion_time: new Date().toISOString()
  };
  const { data } = await api.post(`/shifts/${shiftId}/task-logs/`, logData);
  return data;
};


const TaskRow = ({ task, shiftId, completedTaskIds }) => {
  const queryClient = useQueryClient();

  const isCompleted = completedTaskIds.has(task.id);

  const mutation = useMutation({
    mutationFn: logTaskCompletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
  });

  const handleLogClick = () => {
    mutation.mutate({
      shiftId,
      taskId: task.id
    });
  };

  return (
    <TableRow>
      <TableCell>{task.name}</TableCell>
      <TableCell>{task.category.replace("_", " ")}</TableCell>
      <TableCell>{task.description || 'N/A'}</TableCell>
      <TableCell align="right">
        <Button
          size="small"
          onClick={handleLogClick}
          disabled={isCompleted || mutation.isLoading}
          variant={isCompleted ? "text" : "contained"}
          color={isCompleted ? "success" : "primary"}
        >
          {isCompleted ? 'Logged' : (mutation.isLoading ? 'Logging...' : 'Log as Completed')}
        </Button>
      </TableCell>
    </TableRow>
  );
};



const TaskLoggingPanel = ({ shiftId, activeShiftData }) => {
  
  const { 
    data: taskList, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['scheduledTasks'], 
    queryFn: fetchScheduledTasks
  });

  const completedTaskIds = React.useMemo(() => {
    return new Set(activeShiftData.task_logs.map(log => log.scheduled_task_id));
  }, [activeShiftData.task_logs]);

  if (isLoading) {
    return <CircularProgress />;
  }
  if (isError) {
    return <Alert severity="error">Error fetching scheduled tasks: {error.message}</Alert>;
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Scheduled Tasks (Planning & Routine Tests)
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Task Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {taskList.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                shiftId={shiftId}
                completedTaskIds={completedTaskIds}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TaskLoggingPanel;