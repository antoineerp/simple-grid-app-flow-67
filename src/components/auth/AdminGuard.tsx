
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";

interface AdminGuardProps {
  isLoggedIn: boolean;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ isLoggedIn }) => {
  const userRole = localStorage.getItem('userRole') || '';
  
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  if (userRole !== 'admin') {
    toast({
      title: "Accès refusé",
      description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;
