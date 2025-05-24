
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Pilotage from './pages/Pilotage';
import Index from './pages/Index';
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
import NotFound from './pages/NotFound';
import UserInitializer from './components/core/UserInitializer';
import { getCurrentUser } from './services/core/databaseConnectionService';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/pilotage',
    element: (
      <Layout>
        <UserInitializer />
        <Pilotage />
      </Layout>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <UserInitializer />
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/settings',
    element: (
      <Layout>
        <UserInitializer />
        <Settings />
      </Layout>
    ),
  },
  {
    path: '/ressources-humaines',
    element: (
      <Layout>
        <UserInitializer />
        <RessourcesHumaines />
      </Layout>
    ),
  },
  {
    path: '/membres',
    element: (
      <Layout>
        <UserInitializer />
        <RessourcesHumaines />
      </Layout>
    ),
  },
  {
    path: '/exigences',
    element: (
      <Layout>
        <UserInitializer />
        <Exigences />
      </Layout>
    ),
  },
  {
    path: '/bibliotheque',
    element: (
      <Layout>
        <UserInitializer />
        <Bibliotheque />
      </Layout>
    ),
  },
  {
    path: '/collaboration',
    element: (
      <Layout>
        <UserInitializer />
        <Collaboration />
      </Layout>
    ),
  },
  {
    path: '/admin',
    element: (
      <Layout>
        <UserInitializer />
        <Admin 
          currentDatabaseUser={getCurrentUser()} 
          onUserConnect={(identifiant: string) => {
            // Dispatch a custom event that App.tsx is listening for
            const event = new CustomEvent('database-user-changed', {
              detail: { user: identifiant }
            });
            window.dispatchEvent(event);
          }}
        />
      </Layout>
    ),
  },
  {
    path: '/administration',
    element: (
      <Layout>
        <UserInitializer />
        <Admin 
          currentDatabaseUser={getCurrentUser()} 
          onUserConnect={(identifiant: string) => {
            // Dispatch a custom event that App.tsx is listening for
            const event = new CustomEvent('database-user-changed', {
              detail: { user: identifiant }
            });
            window.dispatchEvent(event);
          }}
        />
      </Layout>
    ),
  },
  {
    path: '/diagnostic',
    element: (
      <Layout>
        <UserInitializer />
        <Diagnostic />
      </Layout>
    ),
  },
  {
    path: '/documents',
    element: (
      <Layout>
        <UserInitializer />
        <Documents />
      </Layout>
    ),
  },
  {
    path: '/gestion-documentaire',
    element: (
      <Layout>
        <UserInitializer />
        <GestionDocumentaire />
      </Layout>
    ),
  },
  {
    path: '*',
    element: (
      <Layout>
        <NotFound />
      </Layout>
    ),
  },
]);

export default router;
