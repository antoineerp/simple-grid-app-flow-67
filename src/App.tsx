
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Exigences from './pages/Exigences';
import RessourcesHumaines from './pages/RessourcesHumaines';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import MainLayout from './layout/MainLayout';
import { getCurrentUser, getLastConnectionError } from './services/core/databaseConnectionService';
import { checkAuth } from './services/auth/authService';
import LoginGuard from './components/auth/LoginGuard';
import AdminGuard from './components/auth/AdminGuard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(checkAuth());
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getCurrentUser());
  const [connectionError, setConnectionError] = useState<string | null>(getLastConnectionError());
  
  useEffect(() => {
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newUser = customEvent.detail?.user;
      if (newUser) {
        setCurrentDatabaseUser(newUser);
        setConnectionError(null);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, []);

  const handleUserConnect = (identifiant: string) => {
    setIsLoggedIn(true);
    setCurrentDatabaseUser(identifiant);
    setConnectionError(null);
  };

  return (
    <Router>
      <Routes>
        {/* Page d'accueil - accessible à tous */}
        <Route path="/" element={<Index />} />
        
        {/* Routes protégées nécessitant une connexion */}
        <Route element={<LoginGuard isLoggedIn={isLoggedIn} />}>
          <Route path="/dashboard" element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/documents" element={
            <MainLayout>
              <Documents />
            </MainLayout>
          } />
          <Route path="/gestion-documentaire" element={
            <MainLayout>
              <Documents />
            </MainLayout>
          } />
          <Route path="/exigences" element={
            <MainLayout>
              <Exigences />
            </MainLayout>
          } />
          <Route path="/ressources-humaines" element={
            <MainLayout>
              <RessourcesHumaines />
            </MainLayout>
          } />
          <Route path="/membres" element={
            <MainLayout>
              <RessourcesHumaines />
            </MainLayout>
          } />
          
          {/* Routes protégées nécessitant un rôle d'administrateur */}
          <Route element={<AdminGuard isLoggedIn={isLoggedIn} />}>
            <Route path="/admin" element={
              <MainLayout>
                <Admin />
              </MainLayout>
            } />
            <Route path="/administration" element={
              <MainLayout>
                <Admin />
              </MainLayout>
            } />
          </Route>
        </Route>

        {/* Page 404 pour les routes non trouvées */}
        <Route path="/404" element={<NotFound />} />
        
        {/* Redirection pour toutes les autres routes */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
