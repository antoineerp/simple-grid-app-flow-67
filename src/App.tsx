
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Composant de route protégée avec gestion des erreurs améliorée
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        const isLoggedIn = getIsLoggedIn();
        const currentUser = getCurrentUser();
        
        console.log('ProtectedRoute - Vérification de connexion:', isLoggedIn);
        console.log('ProtectedRoute - Chemin demandé:', location.pathname);
        
        if (currentUser) {
          console.log('ProtectedRoute - Détails utilisateur:', currentUser.email || 'inconnu');
        }
        
        setIsAuthenticated(isLoggedIn);
      } catch (error) {
        console.error('ProtectedRoute - Erreur lors de la vérification:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [location.pathname]);
  
  // Afficher un indicateur de chargement pendant la vérification
  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Accès non autorisé, redirection vers la page de connexion');
    return <Navigate to="/" />;
  }
  
  console.log('ProtectedRoute - Accès autorisé, affichage du contenu');
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
    <Router>
      <TooltipProvider>
        <MembresProvider>
          <Routes>
            {/* Route publique */}
            <Route path="/" element={<Index />} />
            
            {/* Routes protégées dans le Layout */}
            <Route path="/" element={<Layout />}>
              <Route path="pilotage" element={
                <ProtectedRoute>
                  <MembresProvider>
                    <Pilotage />
                  </MembresProvider>
                </ProtectedRoute>
              } />
              <Route path="db-admin" element={
                <ProtectedRoute>
                  <MembresProvider>
                    <DbAdmin />
                  </ProtectedRoute>
                </ProtectedRoute>
              } />
              
              {/* Routes vers les pages réelles au lieu des placeholders */}
              <Route path="exigences" element={
                <ProtectedRoute>
                  <MembresProvider>
                    <Exigences />
                  </MembresProvider>
                </ProtectedRoute>
              } />
              <Route path="gestion-documentaire" element={
                <ProtectedRoute>
                  <MembresProvider>
                    <GestionDocumentaire />
                  </MembresProvider>
                </ProtectedRoute>
              } />
              <Route path="ressources-humaines" element={
                <ProtectedRoute>
                  <MembresProvider>
                    <RessourcesHumaines />
                  </MembresProvider>
                </ProtectedRoute>
              } />
              <Route path="collaboration" element={
                <ProtectedRoute>
                  <MembresProvider>
                    <Collaboration />
                  </MembresProvider>
                </ProtectedRoute>
              } />
              <Route path="administration" element={
                <ProtectedRoute>
                  <MembresProvider>
                    <Administration />
                  </MembresProvider>
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Redirection pour les routes inconnues */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster />
          <RouteTracker />
        </MembresProvider>
      </TooltipProvider>
    </Router>
  );
}

export default App;
