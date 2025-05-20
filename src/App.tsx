
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Index from '@/pages/Index';
import Exigences from '@/pages/Exigences';
import Pilotage from '@/pages/Pilotage';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Collaboration from '@/pages/Collaboration';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import Settings from '@/pages/Settings';
import Members from '@/pages/Members';
import Administration from '@/pages/Administration';
import DbAdmin from '@/pages/DbAdmin';
import { MembresProvider } from '@/contexts/MembresContext';

// Importer le service de synchronisation automatique centralisée
import { startAutoSync } from '@/services/sync/AutoSyncService';
import { SyncProvider } from '@/features/sync/hooks/useSyncContext';
import { getIsLoggedIn } from './services/auth/authService';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = getIsLoggedIn();
  
  if (!isLoggedIn) {
    // Rediriger vers la page de connexion si non connecté
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  // Initialiser la synchronisation automatique au démarrage
  useEffect(() => {
    console.log('App - Initialisation du service de synchronisation automatique');
    
    // Démarrer la synchronisation automatique
    startAutoSync();
    
    // Nettoyer lors de la fermeture de l'application
    return () => {
      console.log('App - Nettoyage du service de synchronisation');
      // Les services de synchronisation seront automatiquement nettoyés
    };
  }, []);
  
  // Log de démarrage
  useEffect(() => {
    console.log('Application starting...');
    console.log('React version:', React.version);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Root element found, mounting React application');
    console.log('App component mounted successfully');
    
    return () => {
      console.log('Application unmounting...');
    };
  }, []);

  return (
    <SyncProvider>
      <MembresProvider>
        <Router>
          <div className="min-h-screen bg-slate-50">
            <Routes>
              {/* Route de connexion accessible sans authentification */}
              <Route path="/" element={<Index />} />
              
              {/* Routes protégées nécessitant une authentification */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="exigences" element={<Exigences />} />
                <Route path="pilotage" element={<Pilotage />} />
                <Route path="ressources-humaines" element={<RessourcesHumaines />} />
                <Route path="collaboration" element={<Collaboration />} />
                <Route path="gestion-documentaire" element={<GestionDocumentaire />} />
                <Route path="administration" element={<Administration />} />
                <Route path="settings" element={<Settings />} />
                <Route path="membres" element={<Members />} />
                <Route path="dbadmin" element={<DbAdmin />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </Router>
      </MembresProvider>
    </SyncProvider>
  );
};

export default App;
