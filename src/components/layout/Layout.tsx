
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '../Sidebar';
import { Header } from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import { GlobalSyncProvider } from '@/contexts/GlobalSyncContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import ShowSyncDiagnostic from '@/components/layouts/ShowSyncDiagnostic';

const Layout = () => {
  return (
    <GlobalDataProvider>
      <GlobalSyncProvider>
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-slate-50 w-full">
              <Outlet />
            </main>
          </div>
          <Toaster />
          <GlobalSyncManager />
          <ShowSyncDiagnostic />
        </div>
      </GlobalSyncProvider>
    </GlobalDataProvider>
  );
};

export default Layout;
