import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Import our pages and components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // Get the global loading state from the store
  const isLoading = useAuthStore((state) => state.isLoading);

  // 1. Show a global loader while 'checkAuth' is running
  if (isLoading) {
    return (
      <div>
        <h2>Loading Application...</h2>
        {/* En el futuro, esto será un componente <Spinner /> de Material-UI */}
      </div>
    );
  }

  // 2. Once loading is false, render the main router
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route: /login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Route: / (Dashboard) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* Aquí añadiremos más rutas protegidas en el futuro:
          <Route 
            path="/equipment" 
            element={<ProtectedRoute><EquipmentPage /></ProtectedRoute>} 
          />
        */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;