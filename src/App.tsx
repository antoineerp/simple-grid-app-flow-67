
// Ajouter un composant de détection réseau à l'application

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';

// Importation du nouveau composant de détection réseau
import NetworkStatusMonitor from '@/components/sync/NetworkStatusMonitor';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Moniteur de connexion réseau pour le système de synchronisation unifié */}
        <NetworkStatusMonitor />
        
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
