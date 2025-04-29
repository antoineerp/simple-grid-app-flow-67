
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout';
import Dashboard from '@/pages/Dashboard';
import Documentation from '@/pages/Documentation';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import Pilotage from '@/pages/Pilotage';
import Exigences from '@/pages/Exigences';
import Bibliotheque from '@/pages/Bibliotheque';
import Administration from '@/pages/Administration';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Login from '@/pages/Login';
import AuthProvider from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/gestion-documentaire" element={<GestionDocumentaire />} />
            <Route path="/exigences" element={<Exigences />} />
            <Route path="/pilotage" element={<Pilotage />} />
            <Route path="/bibliotheque" element={<Bibliotheque />} />
            <Route path="/administration" element={<Administration />} />
            <Route path="/ressources-humaines" element={<RessourcesHumaines />} />
          </Route>
        </Routes>
        <Toaster />
        <GlobalSyncManager />
      </Router>
    </AuthProvider>
  );
}

export default App;
