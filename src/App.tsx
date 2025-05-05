
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import DbAdmin from '@/pages/DbAdmin';
import DbTest from '@/pages/DbTest';
import Index from '@/pages/Index';
import Layout from '@/components/Layout';
import Pilotage from '@/pages/Pilotage';
import Exigences from '@/pages/Exigences';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Collaboration from '@/pages/Collaboration';
import Administration from '@/pages/Administration';
import NotFound from '@/pages/NotFound';
import { getIsLoggedIn } from '@/services/auth/authService';

// Composant de route protégée qui vérifie l'authentification
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = getIsLoggedIn();
  if (!isLoggedIn) {
    console.log('Unauthorized access attempt, redirecting to login');
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route path="/" element={<Index />} />
        
        {/* Routes protégées dans le Layout */}
        <Route path="/" element={<Layout />}>
          <Route path="pilotage" element={
            <ProtectedRoute>
              <Pilotage />
            </ProtectedRoute>
          } />
          <Route path="exigences" element={
            <ProtectedRoute>
              <Exigences />
            </ProtectedRoute>
          } />
          <Route path="gestion-documentaire" element={
            <ProtectedRoute>
              <GestionDocumentaire />
            </ProtectedRoute>
          } />
          <Route path="ressources-humaines" element={
            <ProtectedRoute>
              <RessourcesHumaines />
            </ProtectedRoute>
          } />
          <Route path="collaboration" element={
            <ProtectedRoute>
              <Collaboration />
            </ProtectedRoute>
          } />
          <Route path="administration" element={
            <ProtectedRoute>
              <Administration />
            </ProtectedRoute>
          } />
          <Route path="db-test" element={
            <ProtectedRoute>
              <DbTest />
            </ProtectedRoute>
          } />
          <Route path="db-admin" element={
            <ProtectedRoute>
              <DbAdmin />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Redirection pour les routes inconnues */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <GlobalSyncManager />
    </Router>
  );
}

export default App;
