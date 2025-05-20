import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Layout } from '@/components/layout/Layout';
import { SyncProvider } from '@/contexts/SyncContext';
import Collaboration from '@/pages/Collaboration';
import Dashboard from '@/pages/Dashboard';
import Membres from '@/pages/Membres';
import Projets from '@/pages/Projets';
import Taches from '@/pages/Taches';
import Documents from '@/pages/Documents';
import Parametres from '@/pages/Parametres';
import Profil from '@/pages/Profil';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import MembresProvider from '@/contexts/MembresContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SyncProvider>
          <MembresProvider>
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/membres" element={<ProtectedRoute><Membres /></ProtectedRoute>} />
                <Route path="/projets" element={<ProtectedRoute><Projets /></ProtectedRoute>} />
                <Route path="/taches" element={<ProtectedRoute><Taches /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                <Route path="/collaboration" element={<ProtectedRoute><Collaboration /></ProtectedRoute>} />
                <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
                <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <GlobalSyncManager />
            </Layout>
          </MembresProvider>
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
