
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
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
        
        console.log("Layout - Initialisation du composant Layout pour un utilisateur connecté");
        console.log("Layout - Nom d'utilisateur:", currentUser?.email);
        console.log("Layout - Rôle utilisateur:", currentUser?.role);
        console.log("Layout - Identifiant technique:", currentUser?.identifiant_technique);
        
        // Reset error state on successful authentication
        setError(null);
      } catch (error) {
        console.error("Layout - Erreur lors de la vérification de l'authentification:", error);
        // Augmenter le nombre d'essais
        setAuthCheckAttempts(prev => prev + 1);
        
        // Set error message
        setError(error instanceof Error ? error.message : "Erreur d'authentification");
        
        // Si nous avons essayé plus de 3 fois sans succès, rediriger vers la page de connexion
        if (authCheckAttempts >= 3) {
          console.log("Layout - Trop d'essais échoués, redirection vers la page de connexion");
          navigate('/', { replace: true });
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Exécuter la vérification immédiatement
    checkAuth();
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
  
  // Si une erreur s'est produite, afficher un message d'erreur
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938-9h13.856c1.54 0 2.502 1.667 1.732 3L13.732 21.94c-.77 1.333-2.694 1.333-3.464 0L3.34 9c-.77-1.333.192-3 1.732-3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setAuthCheckAttempts(0);
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
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
        </div>
      </TooltipProvider>
    </GlobalDataProvider>
  );
};

export default Layout;
