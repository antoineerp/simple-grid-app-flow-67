import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { Header, Sidebar, Layout } from '@/components';
import Index from './pages/Index';
import Pilotage from './pages/Pilotage';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import { isLoggedIn } from '@/services/auth/authService';

// Ajouter l'importation de la page de diagnostic PHP
import PhpTest from './pages/diagnostic/PhpTest';

// Composants pour les tests de connexion
import DbConnectionTest from './components/DbConnectionTest';
import LogoSelector from './components/LogoSelector';
import ResponsableSelector from './components/ResponsableSelector';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const { toast } = useToast();

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Ajouter la page de diagnostic PHP */}
        <Route path="/diagnostic" element={<PhpTest />} />
        
        <Route path="/db-test" element={<DbConnectionTest />} />
        <Route path="/logo-selector" element={<LogoSelector />} />
        <Route path="/responsable-selector" element={<ResponsableSelector />} />
        
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout>
                <Routes>
                  <Route path="*" element={<Admin />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/pilotage/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  {/* Exemple d'une route dans le pilotage */}
                  <Route path="*" element={<Pilotage />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Redirection si aucune route ne correspond */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
