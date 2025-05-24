
// Configuration du routage centralisée
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout'; // Import nommé
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <DashboardPage />
      </Layout>
    )
  },
  // Les autres pages seront ajoutées progressivement
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
]);

export default router; // Export par défaut
