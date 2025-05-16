
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Layout from './components/layout/Layout';
import { SyncProvider } from './context/SyncContext';
import { Toaster } from './components/ui/toaster';

const App = () => {
  return (
    <SyncProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </Router>
      <Toaster />
    </SyncProvider>
  );
};

export default App;
