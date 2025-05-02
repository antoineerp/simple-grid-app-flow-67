
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectPath = '/'
}) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Rediriger vers la page d'accueil si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // Si l'utilisateur est authentifié, afficher les enfants (composant protégé)
  return <>{children}</>;
};

export default ProtectedRoute;
