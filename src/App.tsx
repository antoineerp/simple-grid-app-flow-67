
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { MembresProvider } from '@/contexts/MembresContext';
import { toast } from '@/components/ui/use-toast';

// Composant de route protégée qui vérifie l'authentification
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLoggedIn = getIsLoggedIn();
  const currentUser = getCurrentUser();
  
  console.log('ProtectedRoute - Vérification de connexion:', isLoggedIn);
  console.log('ProtectedRoute - Chemin demandé:', location.pathname);
  console.log('ProtectedRoute - Détails utilisateur:', currentUser?.email || 'inconnu');
  
  useEffect(() => {
    // Afficher une notification pour le débogage
    if (isLoggedIn) {
      toast({
        title: "Accès autorisé",
        description: `Accès à ${location.pathname} autorisé pour ${currentUser?.email || "l'utilisateur"}`,
      });
    } else {
      toast({
        title: "Accès refusé",
        description: `Redirection vers la page de connexion depuis ${location.pathname}`,
        variant: "destructive",
      });
    }
  }, [isLoggedIn, location.pathname, currentUser?.email]);
  
  if (!isLoggedIn) {
    console.log('ProtectedRoute - Accès non autorisé, redirection vers la page de connexion');
    return <Navigate to="/" />;
  }
  
  console.log('ProtectedRoute - Accès autorisé, affichage du contenu');
  return <>{children}</>;
};

// Composant de debug pour tracer le chemin actuel
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('App - Navigation détectée vers:', location.pathname);
  }, [location]);
  
  return null;
};

function App() {
  console.log('App - Rendu initial de l\'application');
  
  return (
    <Router>
      <RouteTracker />
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
