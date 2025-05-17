
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ProtectedLayout from '@/layouts/ProtectedLayout';
import PublicLayout from '@/layouts/PublicLayout';
import AppProviders from '@/providers/AppProviders';

// Lazy load pages for better performance
const Index = React.lazy(() => import('@/pages/Index'));
const Pilotage = React.lazy(() => import('@/pages/Pilotage'));
const GestionDocumentaire = React.lazy(() => import('@/pages/GestionDocumentaire'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const Bibliotheque = React.lazy(() => import('@/pages/Bibliotheque'));
const Exigences = React.lazy(() => import('@/pages/Exigences'));
const RessourcesHumaines = React.lazy(() => import('@/pages/RessourcesHumaines'));
const Collaboration = React.lazy(() => import('@/pages/Collaboration'));
const Administration = React.lazy(() => import('@/pages/Administration'));
const DbAdmin = React.lazy(() => import('@/pages/DbAdmin'));
const ServerTest = React.lazy(() => import('@/pages/ServerTestPage'));
const UserManagement = React.lazy(() => import('@/pages/UserManagement'));

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<div>Chargement...</div>}>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
            </Route>
            
            {/* Protected routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/pilotage" element={<Pilotage />} />
              <Route path="/gestion-documentaire" element={<GestionDocumentaire />} />
              <Route path="/bibliotheque" element={<Bibliotheque />} />
              <Route path="/exigences" element={<Exigences />} />
              <Route path="/ressources-humaines" element={<RessourcesHumaines />} />
              <Route path="/collaboration" element={<Collaboration />} />
              
              {/* Routes d'administration */}
              <Route path="/administration" element={<Administration />} />
              <Route path="/db-admin" element={<DbAdmin />} />
              <Route path="/server-test" element={<ServerTest />} />
              <Route path="/user-management" element={<UserManagement />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
