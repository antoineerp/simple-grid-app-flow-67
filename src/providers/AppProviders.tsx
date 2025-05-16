
import React from 'react';
import { SyncProvider } from '@/contexts/SyncContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <SyncProvider>
      {children}
    </SyncProvider>
  );
};

export default AppProviders;
