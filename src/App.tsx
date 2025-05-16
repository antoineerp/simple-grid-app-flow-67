
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { SyncProvider } from './context/SyncContext';

// Import des pages principales disponibles
import RessourcesHumaines from './pages/RessourcesHumaines';
import Pilotage from './pages/Pilotage';
import GestionDocumentaire from './pages/GestionDocumentaire';
import DbTest from './pages/DbTest';
import AdminPage from './pages/Admin';
import Exigences from './pages/Exigences';
import Collaboration from './pages/Collaboration';
import NotFound from './pages/NotFound';
import UserManagement from './pages/UserManagement';
import Index from './pages/Index';

// Import des composants de context additionnels
import { ToastProvider } from './components/ui/toast';
import { getIsLoggedIn } from './services/auth/authService';

// Composant pour les redirections conditionnelles
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = getIsLoggedIn();
  
  if (!isLoggedIn) {
    console.log("Utilisateur non authentifié, redirection vers la page d'accueil");
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <SyncProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Page d'accueil/connexion - route racine */}
            <Route path="/" element={<Index />} />
            
            {/* Routes protégées dans le Layout */}
            <Route path="/" element={<AuthRoute><Layout /></AuthRoute>}>
              <Route path="/pilotage" element={<Pilotage />} />
              <Route path="/documents" element={<GestionDocumentaire />} />
              <Route path="/gestion-documentaire" element={<GestionDocumentaire />} />
              <Route path="/ressources-humaines" element={<RessourcesHumaines />} />
              <Route path="/exigences" element={<Exigences />} />
              <Route path="/collaboration" element={<Collaboration />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/db-test" element={<DbTest />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </SyncProvider>
  );
}

export default App;
