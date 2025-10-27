// relatorio-ui/src/components/MainLayout.jsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button 
} from '@mui/material';

const MainLayout = () => {
  const navigate = useNavigate();
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* --- BARRA DE NAVEGACIÓN --- */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Relatorio
          </Typography>

          {/* --- NAVEGACIÓN CONDICIONAL POR ROL --- */}
          {user?.role === 'OPS_MANAGER' && (
            <>
              <Button color="inherit" onClick={() => handleNavigate('/equipment')}>
                Equipment
              </Button>
              <Button color="inherit" onClick={() => handleNavigate('/personnel')}>
                Personnel
              </Button>
            </>
          )}

          {user?.role === 'SHIFT_SUPERINTENDENT' && (
            <Button color="inherit" onClick={() => handleNavigate('/active-shift')}>
              Active Shift
            </Button>
          )}

          {/* Botón de Logout */}
          <Button color="inherit" onClick={logout}>
            Log Out (User: {user?.username})
          </Button>
        </Toolbar>
      </AppBar>

      {/* --- CONTENIDO DE LA PÁGINA --- */}
      <Box component="main" sx={{ p: 3 }}>
        {/* El router renderizará la página actual aquí */}
        <Outlet /> 
      </Box>
    </Box>
  );
};

export default MainLayout;