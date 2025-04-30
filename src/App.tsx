
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import DbAdmin from '@/pages/DbAdmin';
import DbTest from '@/pages/DbTest';
import Index from '@/pages/Index';
import Layout from '@/components/layout/Layout';
import Pilotage from '@/pages/Pilotage';
import Exigences from '@/pages/Exigences';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Administration from '@/pages/Administration';
import Collaboration from '@/pages/Collaboration';
import { getIsLoggedIn } from '@/services/auth/authService';
import { MembresProvider } from '@/contexts/MembresContext';

// Composant de route protégée qui vérifie l'authentification
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = getIsLoggedIn();
  
  console.log('ProtectedRoute - Vérification de connexion:', isLoggedIn);
  
  if (!isLoggedIn) {
    console.log('ProtectedRoute - Accès non autorisé, redirection vers la page de connexion');
    return <Navigate to="/" />;
  }
  
  console.log('ProtectedRoute - Accès autorisé');
  return <>{children}</>;
};

function App() {
  console.log('App - Rendu initial de l\'application');
  
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
          
          {/* Routes vers les pages réelles au lieu des placeholders */}
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
              <MembresProvider>
                <RessourcesHumaines />
              </MembresProvider>
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
        </Route>
        
        {/* Redirection pour les routes inconnues */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
