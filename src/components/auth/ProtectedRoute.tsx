
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getIsLoggedIn } from '@/services/auth/authService';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Log pour aider au débogage
    console.log("ProtectedRoute - Vérification d'authentification:");
    console.log("  - isAuthenticated:", isAuthenticated);
    console.log("  - loading:", loading);
    console.log("  - pathname:", location.pathname);
    console.log("  - getIsLoggedIn():", getIsLoggedIn());
  }, [isAuthenticated, loading, location]);
  
  // Si le chargement est en cours, on peut afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Une fois le chargement terminé, vérifier l'authentification
  if (!isAuthenticated && !getIsLoggedIn()) {
    console.log("ProtectedRoute - Redirection vers /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
