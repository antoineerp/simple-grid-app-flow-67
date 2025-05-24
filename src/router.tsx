
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Pilotage from './pages/Pilotage';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import RessourcesHumaines from './pages/RessourcesHumaines';
import Exigences from './pages/Exigences';
import Collaboration from './pages/Collaboration';
import Admin from './pages/Admin';
import Diagnostic from './pages/Diagnostic';
import GestionDocumentaire from './pages/GestionDocumentaire';
import NotFound from './pages/NotFound';
import { LoginPage } from './pages/LoginPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/pilotage',
    element: (
      <Layout>
        <Pilotage />
      </Layout>
    ),
  },
  {
    path: '/ressources-humaines',
    element: (
      <Layout>
        <RessourcesHumaines />
      </Layout>
    ),
  },
  {
    path: '/exigences',
    element: (
      <Layout>
        <Exigences />
      </Layout>
    ),
  },
  {
    path: '/gestion-documentaire',
    element: (
      <Layout>
        <GestionDocumentaire />
      </Layout>
    ),
  },
  {
    path: '/collaboration',
    element: (
      <Layout>
        <Collaboration />
      </Layout>
    ),
  },
  {
    path: '/administration',
    element: (
      <Layout>
        <Admin />
      </Layout>
    ),
  },
  {
    path: '/admin',
    element: (
      <Layout>
        <Admin />
      </Layout>
    ),
  },
  {
    path: '/diagnostic',
    element: (
      <Layout>
        <Diagnostic />
      </Layout>
    ),
  },
  {
    path: '/settings',
    element: (
      <Layout>
        <Settings />
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
