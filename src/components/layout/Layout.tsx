
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);
  
  useEffect(() => {
    const checkAuth = () => {
      // Journalisation détaillée pour le débogage
      console.log("Layout - Vérification de l'authentification, chemin actuel:", location.pathname);
      
      try {
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = getIsLoggedIn();
        const currentUser = getCurrentUser();
        
        console.log("Layout - État de connexion:", isLoggedIn);
        console.log("Layout - Utilisateur actuel:", currentUser);
        
        if (!isLoggedIn) {
          console.log("Layout - Utilisateur non connecté, redirection vers la page de connexion");
          navigate('/', { replace: true });
          return;
        }
        
        console.log("Layout - Utilisateur authentifié");
        setIsAuthenticated(true);
        
        console.log("Layout - Initialisation du composant Layout pour un utilisateur connecté");
        console.log("Layout - Nom d'utilisateur:", currentUser?.email);
        console.log("Layout - Rôle utilisateur:", currentUser?.role);
        console.log("Layout - Identifiant technique:", currentUser?.identifiant_technique);
      } catch (error) {
        console.error("Layout - Erreur lors de la vérification de l'authentification:", error);
        // Augmenter le nombre d'essais
        setAuthCheckAttempts(prev => prev + 1);
        
        // Si nous avons essayé plus de 3 fois sans succès, rediriger vers la page de connexion
        if (authCheckAttempts >= 3) {
          console.log("Layout - Trop d'essais échoués, redirection vers la page de connexion");
          navigate('/', { replace: true });
          return;
        }
        
        // Sinon, réessayer dans 500ms
        setTimeout(checkAuth, 500);
        return;
      } finally {
        setIsLoading(false);
      }
    };
    
    // Exécuter la vérification après un court délai pour s'assurer que tout est chargé
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [navigate, location.pathname, authCheckAttempts]);
  
  // Afficher un indicateur de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Chargement de l'application...</p>
        </div>
      </div>
    );
  }
  
  // Si l'utilisateur n'est pas authentifié, le useEffect se chargera de rediriger
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Vérification des identifiants...</p>
        </div>
      </div>
    );
  }

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
