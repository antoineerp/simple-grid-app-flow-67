
import React, { useEffect, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import AppSyncManager from '@/components/common/AppSyncManager';
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 text-app-blue animate-spin" />
      </div>
    );
  }

  return (
    <GlobalDataProvider>
      <GlobalSyncProvider>
        <TooltipProvider>
          <div className="flex h-screen flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-gray-50 p-4">
                {children}
                <AppSyncManager showControls={false} className="fixed bottom-2 right-2" />
              </main>
            </div>
            <Toaster />
          </div>
        </TooltipProvider>
      </GlobalSyncProvider>
    </GlobalDataProvider>
  );
};

export default Layout;
