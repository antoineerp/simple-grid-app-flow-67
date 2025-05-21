
import React, { useEffect, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { getIsLoggedIn } from '@/services/auth/authService';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Vérifier l'authentification et rediriger si nécessaire
    const checkAuth = () => {
      if (!getIsLoggedIn()) {
        console.log("Layout - Utilisateur non authentifié, redirection vers la page de connexion");
        navigate('/', { replace: true });
        return false;
      }
      return true;
    };
    
    // Initialiser le layout uniquement si authentifié
    const isAuth = checkAuth();
    if (isAuth) {
      console.log("Layout - Initialisation simplifiée");
      // Courte période de chargement pour l'effet visuel
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-app-blue mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <GlobalDataProvider>
        <GlobalSyncProvider>
          <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-y-auto">
                <main className="flex-1">
                  {children}
                </main>
                <GlobalSyncManager />
              </div>
            </div>
            <Toaster />
          </div>
        </GlobalSyncProvider>
      </GlobalDataProvider>
    </TooltipProvider>
  );
};

export default Layout;
