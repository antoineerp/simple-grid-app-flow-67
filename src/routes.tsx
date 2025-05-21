
import React from 'react';
import Pilotage from './pages/Pilotage';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import RessourcesHumaines from './pages/RessourcesHumaines';
import Exigences from './pages/Exigences';
import Bibliotheque from './pages/Bibliotheque';
import Collaboration from './pages/Collaboration';
import Admin from './pages/Admin';
import DiagnosticPage from './pages/diagnostic';
import Documents from './pages/Documents';
import GestionDocumentaire from './pages/GestionDocumentaire';

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
    element: <Admin />,
  },
  {
    path: '/admin',
    element: <Admin />,
  },
  {
    path: '/diagnostic',
    element: <DiagnosticPage />,
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
