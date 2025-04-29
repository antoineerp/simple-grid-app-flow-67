
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import DbAdmin from '@/pages/DbAdmin';
import DbTest from '@/pages/DbTest';
import Index from '@/pages/Index';
import Layout from '@/components/Layout';
import Pilotage from '@/pages/Pilotage';
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
          
          {/* Pour les routes des autres items du menu de navigation */}
          <Route path="exigences" element={
            <ProtectedRoute>
              <div className="p-8">Page des exigences en cours de développement</div>
            </ProtectedRoute>
          } />
          <Route path="gestion-documentaire" element={
            <ProtectedRoute>
              <div className="p-8">Page de gestion documentaire en cours de développement</div>
            </ProtectedRoute>
          } />
          <Route path="ressources-humaines" element={
            <ProtectedRoute>
              <div className="p-8">Page des ressources humaines en cours de développement</div>
            </ProtectedRoute>
          } />
          <Route path="collaboration" element={
            <ProtectedRoute>
              <div className="p-8">Page de collaboration en cours de développement</div>
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Redirection pour les routes inconnues */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
      <GlobalSyncManager />
    </Router>
  );
}

export default App;
