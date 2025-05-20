
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import { SyncProvider } from '@/contexts/SyncContext';
import Collaboration from '@/pages/Collaboration';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import NotFound from '@/pages/NotFound';
import { MembresProvider } from '@/contexts/MembresContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Admin from '@/pages/Admin';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Index from '@/pages/Index';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import Exigences from '@/pages/Exigences';
import Bibliotheque from '@/pages/Bibliotheque';
import DbTest from '@/pages/DbTest';
import DbAdmin from '@/pages/DbAdmin';
import Pilotage from '@/pages/Pilotage';

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <MembresProvider>
              <Layout>
                <Routes>
                  <Route path="/login" element={<Index />} />
                  <Route path="/register" element={<Index />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/membres" element={<ProtectedRoute><RessourcesHumaines /></ProtectedRoute>} />
                  <Route path="/projets" element={<ProtectedRoute><DbTest /></ProtectedRoute>} />
                  <Route path="/taches" element={<ProtectedRoute><Pilotage /></ProtectedRoute>} />
                  <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                  <Route path="/collaboration" element={<ProtectedRoute><Collaboration /></ProtectedRoute>} />
                  <Route path="/parametres" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="/profil" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/gestion-documentaire" element={<ProtectedRoute><GestionDocumentaire /></ProtectedRoute>} />
                  <Route path="/exigences" element={<ProtectedRoute><Exigences /></ProtectedRoute>} />
                  <Route path="/bibliotheque" element={<ProtectedRoute><Bibliotheque /></ProtectedRoute>} />
                  <Route path="/db-admin" element={<ProtectedRoute><DbAdmin /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                <GlobalSyncManager />
              </Layout>
            </MembresProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
