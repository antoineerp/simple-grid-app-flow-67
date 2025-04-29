
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import DbAdmin from '@/pages/DbAdmin';
import DbTest from '@/pages/DbTest';
import Index from '@/pages/Index';
import Layout from '@/components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/db-test" element={<Layout><DbTest /></Layout>} />
        <Route path="/db-admin" element={<Layout><DbAdmin /></Layout>} />
      </Routes>
      <Toaster />
      <GlobalSyncManager />
    </Router>
  );
}

export default App;
