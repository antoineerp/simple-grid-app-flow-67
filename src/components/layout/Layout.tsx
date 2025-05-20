
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simplifier l'initialisation du Layout - ne pas vérifier l'authentification ici
    console.log("Layout - Initialisation simplifiée");
    setIsLoading(false);
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

  return (
    <TooltipProvider>
      <GlobalDataProvider>
        <GlobalSyncProvider>
          <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-y-auto">
              <Header />
              <main className="flex-1">
                <Outlet />
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
