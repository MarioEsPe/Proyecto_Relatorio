// relatorio-ui/src/pages/DashboardPage.jsx
import React from 'react';
import { useAuthStore } from '../store/authStore';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div>
      {/* Saludamos al usuario si la data ya cargó */}
      {user ? (
        <h1>Welcome, {user.username} (Role: {user.role})</h1>
      ) : (
        <h1>Dashboard</h1>
      )}
      
      <p>You are logged in.</p>
      
      <button onClick={logout}>
        Log Out
      </button>
    </div>
  );
};

export default DashboardPage;