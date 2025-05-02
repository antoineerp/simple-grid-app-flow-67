
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if user has admin permissions
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Accès non autorisé</h1>
        <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-white border-b shadow-sm p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5 mr-1" />
              Retour
            </Button>
            <h1 className="text-lg font-semibold">Administration</h1>
          </div>
        </div>
      </div>

      <div className="bg-white border-b mb-6">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto py-2 px-4">
            <Link to="/admin/dashboard" className="px-4 py-2 text-sm font-medium hover:text-primary">
              Tableau de bord
            </Link>
            <Link to="/admin/database" className="px-4 py-2 text-sm font-medium hover:text-primary">
              Base de données
            </Link>
            <Link to="/admin/sync" className="px-4 py-2 text-sm font-medium hover:text-primary">
              Synchronisation
            </Link>
            <Link to="/admin/users" className="px-4 py-2 text-sm font-medium hover:text-primary">
              Utilisateurs
            </Link>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

export default AdminLayout;
