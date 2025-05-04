
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import UserSelectionsManager from '@/components/user-selections/UserSelectionsManager';
import { Skeleton } from '@/components/ui/skeleton';

const UserSelections: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Rediriger vers la page de connexion si non authentifié
  if (!isLoading && !isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container py-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Mes Sélections</h1>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <UserSelectionsManager />
      )}
    </div>
  );
};

export default UserSelections;
