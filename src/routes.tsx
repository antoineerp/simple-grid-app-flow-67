import React from 'react';
import Pilotage from './pages/Pilotage';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import RessourcesHumaines from './pages/RessourcesHumaines';
import Exigences from './pages/Exigences';
import Bibliotheque from './pages/Bibliotheque';
import Collaboration from './pages/Collaboration';
import Admin from './pages/Admin';
import Diagnostic from './pages/Diagnostic';
import Documents from './pages/Documents';
import GestionDocumentaire from './pages/GestionDocumentaire';
import { getCurrentUser } from './services/core/databaseConnectionService';

// Définition des routes de l'application - maintenue pour la compatibilité avec d'éventuels imports
// La configuration principale des routes est désormais dans router.tsx
const routes = [
  {
    path: '/pilotage',
    element: <Pilotage />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/ressources-humaines',
    element: <RessourcesHumaines />,
  },
  {
    path: '/membres',
    element: <RessourcesHumaines />,
  },
  {
    path: '/exigences',
    element: <Exigences />,
  },
  {
    path: '/bibliotheque',
    element: <Bibliotheque />,
  },
  {
    path: '/collaboration',
    element: <Collaboration />,
  },
  {
    path: '/administration',
    element: <Admin 
      currentDatabaseUser={getCurrentUser()}
      onUserConnect={(identifiant: string) => {
        // Dispatch a custom event that App.tsx is listening for
        const event = new CustomEvent('database-user-changed', {
          detail: { user: identifiant }
        });
        window.dispatchEvent(event);
      }}
    />,
  },
  {
    path: '/admin',
    element: <Admin 
      currentDatabaseUser={getCurrentUser()}
      onUserConnect={(identifiant: string) => {
        // Dispatch a custom event that App.tsx is listening for
        const event = new CustomEvent('database-user-changed', {
          detail: { user: identifiant }
        });
        window.dispatchEvent(event);
      }}
    />,
  },
  {
    path: '/diagnostic',
    element: <Diagnostic />,
  },
  {
    path: '/documents',
    element: <Documents />,
  },
  {
    path: '/gestion-documentaire',
    element: <GestionDocumentaire />,
  },
];

export default routes;
