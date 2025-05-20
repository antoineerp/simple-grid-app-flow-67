
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import DbAdmin from '@/pages/DbAdmin';
import Index from '@/pages/Index';
import Layout from '@/components/layout/Layout';
import Pilotage from '@/pages/Pilotage';
import Exigences from '@/pages/Exigences';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Administration from '@/pages/Administration';
import Collaboration from '@/pages/Collaboration';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { MembresProvider } from '@/contexts/MembresContext';
import { initializeSyncStorageCleaner } from './utils/syncStorageCleaner';
import { Loader2 } from 'lucide-react';
import SyncHealthIndicator from './components/common/SyncHealthIndicator';

// Composant de route protégée avec gestion des erreurs améliorée
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);
  
  useEffect(() => {
    const checkAuth = async () => {
      // Journalisation détaillée pour le débogage
      console.log("ProtectedRoute - Vérification de l'authentification, chemin actuel:", location.pathname);
      
      try {
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = getIsLoggedIn();
        const currentUser = getCurrentUser();
        
        console.log("ProtectedRoute - État de connexion:", isLoggedIn);
        console.log("ProtectedRoute - Chemin demandé:", location.pathname);
        
        if (currentUser) {
          console.log("ProtectedRoute - Détails utilisateur:", currentUser.email || 'inconnu');
        }
        
        if (!isLoggedIn) {
          console.log("ProtectedRoute - Utilisateur non connecté, redirection vers la page de connexion");
          navigate('/', { replace: true });
          return;
        }
        
        console.log("ProtectedRoute - Utilisateur authentifié");
        setIsAuthenticated(true);
        
        console.log("ProtectedRoute - Initialisation du composant Layout pour un utilisateur connecté");
        console.log("ProtectedRoute - Nom d'utilisateur:", currentUser?.email);
        console.log("ProtectedRoute - Rôle utilisateur:", currentUser?.role);
        console.log("ProtectedRoute - Identifiant technique:", currentUser?.identifiant_technique);
      } catch (error) {
        console.error("ProtectedRoute - Erreur lors de la vérification de l'authentification:", error);
        // Augmenter le nombre d'essais
        setAuthCheckAttempts(prev => prev + 1);
        
        // Si nous avons essayé plus de 3 fois sans succès, rediriger vers la page de connexion
        if (authCheckAttempts >= 3) {
          console.log("ProtectedRoute - Trop d'essais échoués, redirection vers la page de connexion");
          navigate('/', { replace: true });
          return;
        }
      } finally {
        setIsChecking(false);
      }
    };
    
    // Exécuter la vérification immédiatement
    checkAuth();
  }, [navigate, location.pathname, authCheckAttempts]);
  
  // Afficher un indicateur de chargement pendant la vérification
  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Chargement de l'application...</p>
        </div>
      </div>
    );
  }
  
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

  return <>{children}</>;
};

// Composant pour tracer le chemin actuel
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('App - Navigation détectée vers:', location.pathname);
  }, [location]);
  
  return null;
};

function ErrorBoundaryComponent() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        Une erreur s'est produite
      </h1>
      <p className="mb-6 text-center">
        L'application a rencontré un problème inattendu.
      </p>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => window.location.href = '/'}
      >
        Retourner à l'accueil
      </button>
    </div>
  );
}

function App() {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Gestionnaire d'erreurs global
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("Erreur globale détectée:", event.error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleGlobalError);
    
    // Exécuter le nettoyage des données de synchronisation au démarrage
    try {
      initializeSyncStorageCleaner();
      console.log("App - Nettoyage des données de synchronisation initialisé");
    } catch (error) {
      console.error("App - Erreur lors de l'initialisation du nettoyage:", error);
    }
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);
  
  if (hasError) {
    return <ErrorBoundaryComponent />;
  }
  
  return (
    <div className="app">
      <Router>
        <TooltipProvider>
          <MembresProvider>
            <Routes>
              {/* Route publique */}
              <Route path="/" element={<Index />} />
              
              {/* Routes protégées dans le Layout */}
              <Route path="/" element={<Layout />}>
                <Route path="pilotage" element={<ProtectedRoute><Pilotage /></ProtectedRoute>} />
                <Route path="db-admin" element={<ProtectedRoute><DbAdmin /></ProtectedRoute>} />
                <Route path="exigences" element={<ProtectedRoute><Exigences /></ProtectedRoute>} />
                <Route path="gestion-documentaire" element={<ProtectedRoute><GestionDocumentaire /></ProtectedRoute>} />
                <Route path="ressources-humaines" element={<ProtectedRoute><RessourcesHumaines /></ProtectedRoute>} />
                <Route path="collaboration" element={<ProtectedRoute><Collaboration /></ProtectedRoute>} />
                <Route path="administration" element={<ProtectedRoute><Administration /></ProtectedRoute>} />
              </Route>
              
              {/* Redirection pour les routes inconnues */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Toaster />
            <RouteTracker />
          </MembresProvider>
        </TooltipProvider>
      </Router>
      
      {/* Ajouter l'indicateur de santé des synchronisations */}
      <SyncHealthIndicator position="bottom-right" />
    </div>
  );
}

export default App;
