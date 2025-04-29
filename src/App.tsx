
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import DbAdmin from '@/pages/DbAdmin';
import DbTest from '@/pages/DbTest';
import Index from '@/pages/Index';
import Layout from '@/components/Layout';
import Pilotage from '@/pages/Pilotage';
import { getIsLoggedIn } from '@/services/auth/authService';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/pilotage" element={
          <Layout>
            <Pilotage />
          </Layout>
        } />
        <Route path="/db-test" element={
          <Layout>
            <DbTest />
          </Layout>
        } />
        <Route path="/db-admin" element={
          <Layout>
            <DbAdmin />
          </Layout>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
      <GlobalSyncManager />
    </Router>
  );
}

export default App;
