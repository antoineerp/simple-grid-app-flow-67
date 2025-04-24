
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '@/services/auth/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'gestionnaire' | 'utilisateur';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const isAuthenticated = isLoggedIn();
  const userRole = localStorage.getItem('userRole');
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required, check if user has it
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to="/pilotage" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
