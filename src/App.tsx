
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
