
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();

  // Afficher un indicateur de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Vérification de l'authentification...</span>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // Afficher le contenu si authentifié
  return <>{children}</>;
};

export default PrivateRoute;
