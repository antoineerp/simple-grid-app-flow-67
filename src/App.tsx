
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Layout from './components/layout/Layout';
import { SyncProvider } from './contexts/SyncContext';
import { GlobalSyncProvider } from './contexts/GlobalSyncContext';
import { Toaster } from './components/ui/toaster';
import GlobalSyncManager from './components/common/GlobalSyncManager';

const App = () => {
  console.log("Application starting...");
  console.log("React version:", React.version);
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Root element found, mounting React application");
  
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

console.log("App component mounted successfully");

export default App;
