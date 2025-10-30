// relatorio-ui/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import EquipmentPage from './pages/EquipmentPage';
import PersonnelPage from './pages/PersonnelPage';
import ActiveShiftPage from './pages/ActiveShiftPage';
import HandoverPage from './pages/HandoverPage';

function App() {
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div>
        <h2>Loading Application...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Rutas Públicas --- */}
        <Route path="/login" element={<LoginPage />} />

        {/* --- Rutas Protegidas (envueltas por MainLayout) --- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          
          <Route index element={<Navigate to="/active-shift" replace />} />

          {/* Rutas para SHIFT_SUPERINTENDENT */}
          <Route path="active-shift" element={<ActiveShiftPage />} />
          <Route path="handover" element={<HandoverPage />} />

          {/* Rutas para OPS_MANAGER */}
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="personnel" element={<PersonnelPage />} />
          

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;