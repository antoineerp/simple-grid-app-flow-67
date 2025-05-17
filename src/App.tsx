
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

// Define interface for RequireAuth component
interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

// Create a wrapper component for protected routes
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
              {/* Public route */}
              <Route path="/" element={<Index />} />
              
              {/* Protected routes using the Layout wrapper inside ProtectedRoute */}
              <Route path="/pilotage" element={
                <ProtectedRoute element={
                  <Layout>
                    <Pilotage />
                  </Layout>
                } />
              } />
              
              <Route path="/gestion-documentaire" element={
                <ProtectedRoute element={
                  <Layout>
                    <GestionDocumentaire />
                  </Layout>
                } />
              } />
              
              <Route path="/exigences" element={
                <ProtectedRoute element={
                  <Layout>
                    <Exigences />
                  </Layout>
                } />
              } />
              
              <Route path="/ressources-humaines" element={
                <ProtectedRoute element={
                  <Layout>
                    <RessourcesHumaines />
                  </Layout>
                } />
              } />
              
              <Route path="/collaboration" element={
                <ProtectedRoute element={
                  <Layout>
                    <Collaboration />
                  </Layout>
                } />
              } />
              
              <Route path="/administration" element={
                <ProtectedRoute element={
                  <Layout>
                    <Administration />
                  </Layout>
                } />
              } />
              
              <Route path="/settings" element={<Navigate to="/administration" replace />} />
              
              <Route path="/db-admin" element={
                <ProtectedRoute element={
                  <Layout>
                    <DbAdmin />
                  </Layout>
                } adminOnly />
              } />
              
              <Route path="/database-check" element={
                <ProtectedRoute element={
                  <Layout>
                    <DatabaseCheckPage />
                  </Layout>
                } adminOnly />
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
const RequireAuth: React.FC<RequireAuthProps> = ({ children, adminOnly = false }) => {
  const isLoggedIn = getIsLoggedIn();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/pilotage" replace />;
  }

  return <>{children}</>;
};

export default App;
