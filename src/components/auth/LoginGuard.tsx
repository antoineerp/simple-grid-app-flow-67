
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface LoginGuardProps {
  isLoggedIn: boolean;
}

const LoginGuard: React.FC<LoginGuardProps> = ({ isLoggedIn }) => {
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default LoginGuard;
