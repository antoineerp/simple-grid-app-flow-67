
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// Import des composants de context additionnels
import { ToastProvider } from './components/ui/toast';

function App() {
  return (
    <SyncProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<RessourcesHumaines />} />
              <Route path="/pilotage" element={<Pilotage />} />
              <Route path="/documents" element={<GestionDocumentaire />} />
              <Route path="/gestion-documentaire" element={<GestionDocumentaire />} />
              <Route path="/ressources-humaines" element={<RessourcesHumaines />} />
              <Route path="/exigences" element={<Exigences />} />
              <Route path="/collaboration" element={<Collaboration />} />
              <Route path="/admin" element={<AdminPage />} />
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
