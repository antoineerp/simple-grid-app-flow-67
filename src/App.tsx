
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { SyncProvider } from './context/SyncContext';

// Import des pages principales
import HomePage from './pages/HomePage';
import PilotagePage from './pages/PilotagePage';
import DocumentsPage from './pages/DocumentsPage';
import CollaborationPage from './pages/CollaborationPage';
import BibliothequePages from './pages/BibliothequePages';
import AuditsPage from './pages/AuditsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import SignInPage from './pages/SignInPage';

// Import des composants de context additionnels
import { ToastProvider } from './components/ui/toast';

function App() {
  return (
    <SyncProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/pilotage" element={<PilotagePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/collaboration" element={<CollaborationPage />} />
              <Route path="/bibliotheque" element={<BibliothequePages />} />
              <Route path="/audits" element={<AuditsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </SyncProvider>
  );
}

export default App;
