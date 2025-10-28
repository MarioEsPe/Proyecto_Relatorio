// relatorio-ui/src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * This component acts as a guard for routes that require authentication.
 * @param {object} props
 * @param {React.ReactNode} props.children The component to render if authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation(); // To remember where the user was trying to go

  if (!token) {
    // If there's no token, redirect to the /login page.
    // We save the 'from' location so we can redirect them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a token exists, render the requested child component (e.g., DashboardPage)
  return children;
};

export default ProtectedRoute;