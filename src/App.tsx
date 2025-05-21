
import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import MembresProvider from '@/contexts/MembresContext';
import router from './router';

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
          <MembresProvider>
            <RouterProvider router={router} />
            <Toaster />
          </MembresProvider>
        </GlobalSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
