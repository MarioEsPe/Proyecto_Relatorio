// relatorio-ui/src/components/AttendancePanel.jsx
import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  Button,
  FormControl,
} from '@mui/material';

const ATTENDANCE_STATUSES = [
  "Present",
  "Absent",
  "Permission",
  "Vacation",
  "Medical Leave"
];


const fetchShiftAttendance = async (shiftId) => {
  const { data } = await api.get(`/shifts/${shiftId}/attendance`);
  return data;
};

const fetchEmployees = async () => {
  const { data } = await api.get('/personnel/employees/');
  return data;
};

const updateAttendanceRecord = async ({ attendanceId, updateData }) => {
  const { data } = await api.patch(`/attendance/${attendanceId}`, updateData);
  return data;
};



const AttendanceRow = ({ record, allEmployees }) => {
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState(record.attendance_status);
  const [actualEmployeeId, setActualEmployeeId] = useState(record.actual_employee.id);

  useEffect(() => {
    setStatus(record.attendance_status);
    setActualEmployeeId(record.actual_employee.id);
  }, [record]);

  const mutation = useMutation({
    mutationFn: updateAttendanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftAttendance', record.shift_id] });
    }
  });

  const isChanged = 
    status !== record.attendance_status || 
    actualEmployeeId !== record.actual_employee.id;

  const handleSave = () => {
    mutation.mutate({
      attendanceId: record.id,
      updateData: {
        attendance_status: status,
        actual_employee_id: actualEmployeeId
      }
    });
  };

  return (
    <TableRow>
      <TableCell>{record.position.name}</TableCell>
      <TableCell>{record.scheduled_employee.full_name}</TableCell>
      <TableCell>
        <FormControl size="small" fullWidth>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {ATTENDANCE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </TableCell>
      <TableCell>
        <FormControl size="small" fullWidth>
          <Select
            value={actualEmployeeId}
            onChange={(e) => setActualEmployeeId(e.target.value)}
          >
            {allEmployees.map(emp => (
              <MenuItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.rpe})</MenuItem>
            ))}
          </Select>
        </FormControl>
      </TableCell>
      <TableCell align="right">
        <Button
          size="small"
          onClick={handleSave}
          disabled={!isChanged || mutation.isLoading}
          variant={isChanged ? "contained" : "text"}
        >
          {mutation.isLoading ? 'Saving...' : 'Save'}
        </Button>
      </TableCell>
    </TableRow>
  );
};


const AttendancePanel = ({ shiftId }) => {
  
  const { 
    data: attendanceData, 
    isLoading: isLoadingAttendance,
    isError: isErrorAttendance,
    error: errorAttendance
  } = useQuery({
    queryKey: ['shiftAttendance', shiftId], 
    queryFn: () => fetchShiftAttendance(shiftId)
  });

  const { 
    data: allEmployees, 
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
    error: errorEmployees
  } = useQuery({
    queryKey: ['employees'], 
    queryFn: fetchEmployees
  });

  if (isLoadingAttendance || isLoadingEmployees) {
    return (
      <Paper sx={{ p: 2, mt: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading Personnel Data...</Typography>
      </Paper>
    );
  }
  if (isErrorAttendance || isErrorEmployees) {
    return <Alert severity="error">
      {errorAttendance?.message || errorEmployees?.message}
    </Alert>;
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Personnel Attendance
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Position</TableCell>
              <TableCell>Scheduled Employee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actual Employee (Covering)</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceData.map(record => (
              <AttendanceRow 
                key={record.id} 
                record={record} 
                allEmployees={allEmployees} 
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default AttendancePanel; 