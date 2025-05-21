
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import Layout from '@/components/layout/Layout';
import routes from '@/routes';
import UserInitializer from '@/components/core/UserInitializer';

function App() {
  useEffect(() => {
    console.info('App component mounted successfully');

    return () => {
      console.info('Application unmounting...');
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <GlobalSyncProvider>
          <UserInitializer />
          <Layout>
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </Layout>
          <Toaster />
        </GlobalSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
