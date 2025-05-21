
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Pilotage from './pages/Pilotage';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import MembresList from './pages/MembresList';
import MembreDetail from './pages/MembreDetail';
import ExigencesList from './pages/ExigencesList';
import ExigenceDetail from './pages/ExigenceDetail';
import Audit from './pages/Audit';
import Admin from './pages/Admin';
import Bibliotheque from './pages/Bibliotheque';
import Collaboration from './pages/Collaboration';
import DiagnosticPage from './pages/diagnostic';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/pilotage',
    element: <App />,
    children: [
      {
        path: '',
        element: <Pilotage />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'membres',
        element: <MembresList />,
      },
      {
        path: 'membres/:id',
        element: <MembreDetail />,
      },
      {
        path: 'exigences',
        element: <ExigencesList />,
      },
      {
        path: 'exigences/:id',
        element: <ExigenceDetail />,
      },
      {
        path: 'bibliotheque',
        element: <Bibliotheque />,
      },
      {
        path: 'collaboration',
        element: <Collaboration />,
      },
      {
        path: 'audit',
        element: <Audit />,
      },
      {
        path: 'admin',
        element: <Admin />,
      },
      {
        path: 'diagnostic',
        element: <DiagnosticPage />,
      },
    ],
  },
]);

export default router;
