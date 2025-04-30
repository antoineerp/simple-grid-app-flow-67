
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Journalisation détaillée pour le débogage
    console.log("Layout - Rendu initial, chemin actuel:", location.pathname);
    
    // Notification pour aider à déboguer
    toast({
      title: "Chargement layout",
      description: `Chemin actuel: ${location.pathname}`,
    });
    
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = getIsLoggedIn();
    const currentUser = getCurrentUser();
    
    console.log("Layout - État de connexion:", isLoggedIn);
    console.log("Layout - Utilisateur actuel:", currentUser);
    
    if (!isLoggedIn) {
      console.log("Layout - Utilisateur non connecté, redirection vers la page de connexion");
      navigate('/');
      return;
    }
    
    console.log("Layout - Initialisation du composant Layout pour un utilisateur connecté");
    console.log("Layout - Nom d'utilisateur:", currentUser?.email);
    console.log("Layout - Rôle utilisateur:", currentUser?.role);
    console.log("Layout - Identifiant technique:", currentUser?.identifiant_technique);
    
    // Vérifier que tous les contextes sont disponibles
    try {
      if (document.querySelector('[data-testid="global-sync-initialized"]')) {
        console.log("Layout - Contexte GlobalSync initialisé correctement");
      } else {
        console.warn("Layout - Élément GlobalSync non trouvé dans le DOM");
      }
    } catch (error) {
      console.error("Layout - Erreur lors de la vérification des contextes:", error);
    }
    
  }, [navigate, location.pathname]);

  return (
    <GlobalDataProvider>
      <GlobalSyncProvider>
        <TooltipProvider>
          <div className="flex flex-col h-screen bg-background">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-slate-50 w-full">
                <div data-testid="layout-content">
                  <Outlet />
                </div>
              </main>
            </div>
            <Toaster />
            <GlobalSyncManager />
            <div data-testid="global-sync-initialized" className="hidden" />
          </div>
        </TooltipProvider>
      </GlobalSyncProvider>
    </GlobalDataProvider>
  );
};

export default Layout;
