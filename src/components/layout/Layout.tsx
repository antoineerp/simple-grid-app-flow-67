
import React, { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import { getIsLoggedIn } from '@/services/auth/authService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Journalisation détaillée pour le débogage
    console.log("Layout - Vérification de l'authentification, chemin actuel:", location.pathname);
    
    // Court délai pour permettre à l'auth de s'initialiser
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

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

  // Si nous sommes sur une page d'authentification, afficher uniquement les enfants sans le layout complet
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/';
  
  if (isAuthPage) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          {children}
          <Toaster />
        </div>
      </TooltipProvider>
    );
  }

  // Pour les pages protégées, afficher le layout complet avec la sidebar
  return (
    <TooltipProvider>
      <GlobalDataProvider>
        <GlobalSyncProvider>
          <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-y-auto">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <GlobalSyncManager />
            </div>
            <Toaster />
          </div>
        </GlobalSyncProvider>
      </GlobalDataProvider>
    </TooltipProvider>
  );
};

export default Layout;
