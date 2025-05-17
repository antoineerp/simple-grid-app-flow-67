import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [isFatalError, setIsFatalError] = useState(false);
  
  useEffect(() => {
    // Fonction pour vérifier l'authentification
    const checkAuth = async () => {
      try {
        console.log("Layout - Vérification de l'authentification, chemin actuel:", location.pathname);
        
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = getIsLoggedIn();
        const currentUser = getCurrentUser();
        
        console.log("Layout - État de connexion:", isLoggedIn);
        console.log("Layout - Utilisateur actuel:", currentUser);
        
        if (!isLoggedIn && location.pathname !== '/') {
          console.log("Layout - Utilisateur non connecté, redirection vers la page de connexion");
          setError("Session expirée ou non connecté");
          navigate('/', { replace: true });
          return;
        }
        
        if (isLoggedIn) {
          console.log("Layout - Utilisateur authentifié");
          setIsAuthenticated(true);
          
          console.log("Layout - Initialisation du composant Layout pour un utilisateur connecté");
          console.log("Layout - Nom d'utilisateur:", currentUser?.email);
          console.log("Layout - Rôle utilisateur:", currentUser?.role);
          console.log("Layout - Identifiant technique:", currentUser?.identifiant_technique);
          
          // Si on est sur la page de login et déjà connecté, rediriger vers /pilotage
          if (location.pathname === '/') {
            console.log("Layout - Déjà connecté, redirection vers /pilotage");
            navigate('/pilotage', { replace: true });
          }
        }
        
        // Reset error state on successful authentication
        setError(null);
        setErrorDetail(null);
        setIsFatalError(false);
      } catch (error) {
        console.error("Layout - Erreur lors de la vérification de l'authentification:", error);
        // Augmenter le nombre d'essais
        setAuthCheckAttempts(prev => prev + 1);
        
        // Set error message
        const errorMessage = error instanceof Error ? error.message : "Erreur d'authentification";
        setError(errorMessage);
        setErrorDetail(error instanceof Error && error.stack ? error.stack : null);
        
        // Si nous avons essayé plus de 3 fois sans succès, rediriger vers la page de connexion
        if (authCheckAttempts >= 3) {
          console.log("Layout - Trop d'essais échoués, redirection vers la page de connexion");
          setIsFatalError(true);
          
          // Afficher un toast d'erreur
          toast({
            title: "Problème d'authentification",
            description: "Veuillez vous reconnecter",
            variant: "destructive",
          });
          
          navigate('/', { replace: true });
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Exécuter la vérification immédiatement
    checkAuth();
  }, [navigate, location.pathname, authCheckAttempts, toast]);
  
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
  if (error && (isFatalError || !isAuthenticated)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center max-w-md text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          {errorDetail && (
            <details className="mt-2 text-xs text-left w-full p-2 bg-gray-50 rounded">
              <summary className="cursor-pointer text-blue-500">Détails techniques</summary>
              <pre className="mt-2 whitespace-pre-wrap">{errorDetail}</pre>
            </details>
          )}
          <button 
            onClick={() => {
              setError(null);
              setErrorDetail(null);
              setIsFatalError(false);
              setAuthCheckAttempts(0);
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('authToken');
              sessionStorage.removeItem('authToken');
              localStorage.removeItem('currentUser');
              navigate('/', { replace: true });
              window.location.reload();
            }}
            className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Rendu normal du layout une fois authentifié
  return (
    <GlobalDataProvider>
      <TooltipProvider>
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-slate-50 w-full">
              <div data-testid="layout-content">
                {children || <Outlet />}
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
