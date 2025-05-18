
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { MembresProvider } from '@/contexts/MembresContext';
import { initializeSyncStorageCleaner } from './utils/syncStorageCleaner';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import SyncHealthIndicator from './components/common/SyncHealthIndicator';

// Lazy load pages pour améliorer les performances
const Index = React.lazy(() => import('@/pages/Index'));
const Pilotage = React.lazy(() => import('@/pages/Pilotage'));
const GestionDocumentaire = React.lazy(() => import('@/pages/GestionDocumentaire'));
const RessourcesHumaines = React.lazy(() => import('@/pages/RessourcesHumaines'));
const Collaboration = React.lazy(() => import('@/pages/Collaboration'));
const Administration = React.lazy(() => import('@/pages/Administration'));
const Exigences = React.lazy(() => import('@/pages/Exigences'));
const DbAdmin = React.lazy(() => import('@/pages/DbAdmin'));
const DatabaseCheckPage = React.lazy(() => import('@/pages/DatabaseCheckPage'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Initialiser le nettoyage du stockage de synchronisation
initializeSyncStorageCleaner();

/**
 * Composant pour protéger les routes qui nécessitent une authentification
 */
const ProtectedRoute: React.FC<{ element: React.ReactNode; adminOnly?: boolean }> = ({ 
  element, 
  adminOnly = false 
}) => {
  const isLoggedIn = getIsLoggedIn();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/pilotage" replace />;
  }

  return <>{element}</>;
};

function App() {
  return (
    <Router>
      <TooltipProvider>
        <MembresProvider>
          <SyncHealthIndicator />
          <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Chargement...</span>
            </div>
          }>
            <Routes>
              {/* Route publique - une seule définition */}
              <Route path="/" element={<Index />} />
              
              {/* Routes protégées avec wrapper Layout - une seule définition par route */}
              <Route path="/pilotage" element={
                <ProtectedRoute element={<Layout><Pilotage /></Layout>} />
              } />
              
              <Route path="/gestion-documentaire" element={
                <ProtectedRoute element={<Layout><GestionDocumentaire /></Layout>} />
              } />
              
              <Route path="/exigences" element={
                <ProtectedRoute element={<Layout><Exigences /></Layout>} />
              } />
              
              <Route path="/ressources-humaines" element={
                <ProtectedRoute element={<Layout><RessourcesHumaines /></Layout>} />
              } />
              
              <Route path="/collaboration" element={
                <ProtectedRoute element={<Layout><Collaboration /></Layout>} />
              } />
              
              <Route path="/administration" element={
                <ProtectedRoute element={<Layout><Administration /></Layout>} />
              } />
              
              {/* Redirection pour retrocompatibilité */}
              <Route path="/settings" element={<Navigate to="/administration" replace />} />
              
              {/* Routes administrateur */}
              <Route path="/db-admin" element={
                <ProtectedRoute element={<Layout><DbAdmin /></Layout>} adminOnly />
              } />
              
              <Route path="/database-check" element={
                <ProtectedRoute element={<Layout><DatabaseCheckPage /></Layout>} adminOnly />
              } />
              
              {/* Capture de toutes les autres routes - une seule définition */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </MembresProvider>
      </TooltipProvider>
    </Router>
  );
}

export default App;
