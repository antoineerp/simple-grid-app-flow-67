
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import ShowSyncDiagnostic from '@/components/layouts/ShowSyncDiagnostic';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Journalisation détaillée pour le débogage
    console.log("Layout - Rendu initial, chemin actuel:", location.pathname);
    
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
    
    // Notification pour aider à déboguer
    toast({
      title: "Application chargée",
      description: "Le composant Layout a été initialisé correctement pour " + (currentUser?.email || "l'utilisateur"),
    });
    
    // Vérifier l'état des contextes
    console.log("Layout - Vérification de l'environnement:");
    console.log("- window.location:", window.location.href);
    console.log("- React Router path:", location.pathname);
    
    // Pour le débogage des contextes
    setTimeout(() => {
      console.log("Layout - Vérification des contextes après rendu complet");
      
      try {
        const globalSyncElement = document.querySelector('[data-testid="global-sync-initialized"]');
        console.log("- Élément GlobalSync trouvé:", !!globalSyncElement);
        
        const mainContentElement = document.querySelector('main');
        console.log("- Contenu principal chargé:", !!mainContentElement);
        
        if (mainContentElement) {
          console.log("- Nombre d'enfants dans le contenu principal:", mainContentElement.childNodes.length);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du DOM:", error);
      }
    }, 500);
    
  }, [navigate, location.pathname]);

  return (
    <GlobalDataProvider>
      <GlobalSyncProvider>
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
          <ShowSyncDiagnostic />
          <div data-testid="global-sync-initialized" className="hidden" />
        </div>
      </GlobalSyncProvider>
    </GlobalDataProvider>
  );
};

export default Layout;
