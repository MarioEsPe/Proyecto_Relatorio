// relatorio-ui/src/pages/PersonnelPage.jsx
import React, { useState } from 'react';

// Importar componentes de MUI
import {
  Typography,
  Box,
  Tabs,
  Tab
} from '@mui/material';

import PositionsPanel from '../components/PositionsPanel';
import EmployeesPanel from '../components/EmployeesPanel';  


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`personnel-tabpanel-${index}`}
      aria-labelledby={`personnel-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PersonnelPage = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Personnel & Groups Management
      </Typography>
      
      {/* --- Pestañas de Navegación --- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="personnel management tabs">
          <Tab label="Positions" id="personnel-tab-0" />
          <Tab label="Employees" id="personnel-tab-1" />
          <Tab label="Shift Groups" id="personnel-tab-2" />
        </Tabs>
      </Box>

      {/* --- Contenido de las Pestañas --- */}
      <TabPanel value={currentTab} index={0}>
        <PositionsPanel />
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <EmployeesPanel />
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        <Typography>Shift Groups Management (Coming Soon)</Typography>
        {/* <GroupsPanel /> */}
      </TabPanel>
    </Box>
  );
};

export default PersonnelPage;