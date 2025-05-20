
import React, { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
        
        // Si nous sommes sur la page de connexion ou d'inscription, ne pas rediriger
        const isAuthPage = location.pathname === '/login' || 
                          location.pathname === '/register' || 
                          location.pathname === '/';
        
        if (!isLoggedIn && !isAuthPage) {
          console.log("Layout - Utilisateur non connecté et hors page d'authentification, redirection vers la page de connexion");
          navigate('/login', { replace: true });
          return;
        }
        
        // Si nous sommes déjà sur une page d'auth et que l'utilisateur est connecté, 
        // rediriger vers le tableau de bord
        if (isLoggedIn && isAuthPage) {
          console.log("Layout - Utilisateur connecté sur page d'auth, redirection vers le tableau de bord");
          navigate('/dashboard', { replace: true });
          return;
        }
        
        console.log("Layout - Utilisateur authentifié ou sur page d'authentification");
        setIsAuthenticated(isLoggedIn);
        
        console.log("Layout - Initialisation du composant Layout terminée");
        
        // Après avoir confirmé l'authentification, marquer comme "non chargement"
        setIsLoading(false);
        
      } catch (error) {
        console.error("Layout - Erreur lors de la vérification de l'authentification:", error);
        
        // En cas d'erreur, augmenter le compteur de tentatives
        setAuthCheckAttempts(prevAttempts => prevAttempts + 1);
        
        // Si trop de tentatives, considérer comme non authentifié et rediriger vers la login
        if (authCheckAttempts >= 3) {
          console.log("Layout - Trop de tentatives échouées, redirection vers la page de connexion");
          navigate('/login', { replace: true });
        }
      }
    };
    
    // Appliquer un petit délai pour éviter les redirections trop rapides
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => clearTimeout(timer);
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
