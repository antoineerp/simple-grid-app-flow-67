
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Layout from './components/layout/Layout';
import { SyncProvider } from './context/SyncContext';
import { GlobalSyncProvider } from './contexts/GlobalSyncContext';
import { Toaster } from './components/ui/toaster';
import GlobalSyncManager from './components/common/GlobalSyncManager';

const App = () => {
  return (
    <SyncProvider>
      <GlobalSyncProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/*" element={<Layout />} />
          </Routes>
          <GlobalSyncManager />
        </Router>
        <Toaster />
      </GlobalSyncProvider>
    </SyncProvider>
  );
};

export default App;
