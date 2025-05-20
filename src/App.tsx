
/**
 * Point d'entrée principal de l'application
 * Initialise les services de synchronisation
 */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import Exigences from '@/pages/Exigences';
import Pilotage from '@/pages/Pilotage';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Collaboration from '@/pages/Collaboration';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import DbAdmin from '@/pages/DbAdmin';
import Settings from '@/pages/Settings';
import Members from '@/pages/Members';
import Administration from '@/pages/Administration';

// Importer le service de synchronisation automatique centralisée
import { startAutoSync } from '@/services/sync/AutoSyncService';

const App = () => {
  // Initialiser la synchronisation automatique au démarrage
  useEffect(() => {
    console.log('App - Initialisation du service de synchronisation automatique');
    
    // Démarrer la synchronisation automatique
    startAutoSync();
    
    // Nettoyer lors de la fermeture de l'application
    return () => {
      console.log('App - Nettoyage du service de synchronisation');
      // Les services de synchronisation seront automatiquement nettoyés
    };
  }, []);
  
  // Log de démarrage
  useEffect(() => {
    console.log('Application starting...');
    console.log('React version:', React.version);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Root element found, mounting React application');
    
    return () => {
      console.log('Application unmounting...');
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="gestion-documentaire" element={<GestionDocumentaire />} />
            <Route path="documents" element={<Documents />} />
            <Route path="exigences" element={<Exigences />} />
            <Route path="pilotage" element={<Pilotage />} />
            <Route path="ressources-humaines" element={<RessourcesHumaines />} />
            <Route path="collaboration" element={<Collaboration />} />
            <Route path="administration" element={<Administration />} />
            <Route path="membres" element={<Members />} />
            <Route path="dbadmin" element={<DbAdmin />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
};

export default App;
