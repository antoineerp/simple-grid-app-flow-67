
import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import ShowSyncDiagnostic from '@/components/layouts/ShowSyncDiagnostic';
import { getIsLoggedIn } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';

const Layout = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = getIsLoggedIn();
    console.log("Layout - État de connexion:", isLoggedIn);
    
    if (!isLoggedIn) {
      console.log("Layout - Utilisateur non connecté, redirection vers la page de connexion");
      navigate('/');
      return;
    }
    
    console.log("Layout - Initialisation du composant Layout pour un utilisateur connecté");
    
    // Notification pour aider à déboguer
    toast({
      title: "Application chargée",
      description: "Le composant Layout a été initialisé correctement",
    });
    
  }, [navigate]);

  return (
    <GlobalDataProvider>
      <GlobalSyncProvider>
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-slate-50 w-full">
              <Outlet />
            </main>
          </div>
          <Toaster />
          <GlobalSyncManager />
          <ShowSyncDiagnostic />
        </div>
      </GlobalSyncProvider>
    </GlobalDataProvider>
  );
};

export default Layout;
