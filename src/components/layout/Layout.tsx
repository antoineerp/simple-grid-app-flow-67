
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from './Sidebar';
import Header from './Header';
import { GlobalDataProvider } from '@/contexts/GlobalDataContext';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';

const Layout = () => {
  return (
    <GlobalDataProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-slate-50">
            <Outlet />
          </main>
        </div>
        <Toaster />
        <GlobalSyncManager />
      </div>
    </GlobalDataProvider>
  );
};

export default Layout;
