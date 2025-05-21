
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Pilotage from './pages/Pilotage';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Members from './pages/Members';
import Bibliotheque from './pages/Bibliotheque';
import Collaboration from './pages/Collaboration';
import DiagnosticPage from './pages/diagnostic';
import RessourcesHumaines from './pages/RessourcesHumaines';
import Documents from './pages/Documents';
import Exigences from './pages/Exigences';
import Admin from './pages/Admin';

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
        element: <RessourcesHumaines />,
      },
      {
        path: 'exigences',
        element: <Exigences />,
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
        path: 'admin',
        element: <Admin />,
      },
      {
        path: 'diagnostic',
        element: <DiagnosticPage />,
      },
      {
        path: 'documents',
        element: <Documents />,
      },
    ],
  },
]);

export default router;
