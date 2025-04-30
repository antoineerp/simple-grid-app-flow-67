
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SyncProvider } from './contexts/GlobalSyncContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorAlert from './components/GlobalErrorAlert';
import GlobalSyncManager from './components/common/GlobalSyncManager';
import { initializeSyncStorageCleaner } from './utils/syncStorageCleaner';

// Pages
import Pilotage from './pages/Pilotage';
import DbAdmin from './pages/DbAdmin';
import Exigences from './pages/Exigences';
import GestionDocumentaire from './pages/GestionDocumentaire';
import RessourcesHumaines from './pages/RessourcesHumaines';
import Collaboration from './pages/Collaboration';
import Administration from './pages/Administration';

// App component
function App() {
  // Initialiser le nettoyage du stockage
  useEffect(() => {
    initializeSyncStorageCleaner();
  }, []);

  return (
    <div className="app">
      <Router>
        <AuthProvider>
          <SyncProvider>
            <Routes>
              {/* Route publique */}
              <Route path="/" element={<Login />} />
              
              {/* Routes protégées dans le Layout */}
              <Route path="/" element={<Dashboard />}>
                <Route path="pilotage" element={
                  <PrivateRoute>
                    <Pilotage />
                  </PrivateRoute>
                } />
                
                <Route path="db-admin" element={
                  <PrivateRoute>
                    <DbAdmin />
                  </PrivateRoute>
                } />
                
                {/* Routes vers les pages réelles */}
                <Route path="exigences" element={
                  <PrivateRoute>
                    <Exigences />
                  </PrivateRoute>
                } />
                
                <Route path="gestion-documentaire" element={
                  <PrivateRoute>
                    <GestionDocumentaire />
                  </PrivateRoute>
                } />
                
                <Route path="ressources-humaines" element={
                  <PrivateRoute>
                    <RessourcesHumaines />
                  </PrivateRoute>
                } />
                
                <Route path="collaboration" element={
                  <PrivateRoute>
                    <Collaboration />
                  </PrivateRoute>
                } />
                
                <Route path="administration" element={
                  <PrivateRoute>
                    <Administration />
                  </PrivateRoute>
                } />
              </Route>
              
              {/* Redirection pour les routes inconnues */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Toaster />
            <GlobalErrorAlert />
            <GlobalSyncManager />
          </SyncProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
