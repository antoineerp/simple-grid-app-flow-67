
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

// Lazy load pages for better performance
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

// Initialize the sync storage cleaner
initializeSyncStorageCleaner();

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
              {/* Public route */}
              <Route path="/" element={<Index />} />
              
              {/* Protected routes */}
              <Route path="/pilotage" element={
                <RequireAuth>
                  <Layout>
                    <Pilotage />
                  </Layout>
                </RequireAuth>
              } />
              
              <Route path="/gestion-documentaire" element={
                <RequireAuth>
                  <Layout>
                    <GestionDocumentaire />
                  </Layout>
                </RequireAuth>
              } />
              
              <Route path="/exigences" element={
                <RequireAuth>
                  <Layout>
                    <Exigences />
                  </Layout>
                </RequireAuth>
              } />
              
              <Route path="/ressources-humaines" element={
                <RequireAuth>
                  <Layout>
                    <RessourcesHumaines />
                  </Layout>
                </RequireAuth>
              } />
              
              <Route path="/collaboration" element={
                <RequireAuth>
                  <Layout>
                    <Collaboration />
                  </Layout>
                </RequireAuth>
              } />
              
              <Route path="/administration" element={
                <RequireAuth>
                  <Layout>
                    <Administration />
                  </Layout>
                </RequireAuth>
              } />
              
              <Route path="/settings" element={<Navigate to="/administration" replace />} />
              
              <Route path="/db-admin" element={
                <RequireAuth adminOnly>
                  <Layout>
                    <DbAdmin />
                  </Layout>
                </RequireAuth>
              } />
              
              <Route path="/database-check" element={
                <RequireAuth adminOnly>
                  <Layout>
                    <DatabaseCheckPage />
                  </Layout>
                </RequireAuth>
              } />
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </MembresProvider>
      </TooltipProvider>
    </Router>
  );
}

// Wrap component with auth protection
function RequireAuth({ children, adminOnly = false }) {
  const isLoggedIn = getIsLoggedIn();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/pilotage" replace />;
  }

  return children;
}

export default App;
