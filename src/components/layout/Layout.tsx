
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
    const checkAuth = async () => {
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
        
        console.log("Layout - Initialisation du composant Layout terminée");
        
        // Après avoir confirmé l'authentification, marquer comme "non chargement"
        setIsLoading(false);
        
      } catch (error) {
        console.error("Layout - Erreur lors de la vérification de l'authentification:", error);
        
        // En cas d'erreur, augmenter le compteur de tentatives
        setAuthCheckAttempts(prevAttempts => prevAttempts + 1);
        
        // Si trop de tentatives, considérer comme non authentifié
        if (authCheckAttempts >= 3) {
          console.log("Layout - Trop de tentatives échouées, redirection vers la page de connexion");
          navigate('/', { replace: true });
        }
      }
    };
    
    checkAuth();
  }, [navigate, location.pathname, authCheckAttempts]);

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
