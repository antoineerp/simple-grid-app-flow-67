
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import GlobalSyncManager from '@/components/common/GlobalSyncManager';
import DbAdmin from '@/pages/DbAdmin';
import DbTest from '@/pages/DbTest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DbTest />} />
        <Route path="/db-admin" element={<DbAdmin />} />
      </Routes>
      <Toaster />
      <GlobalSyncManager />
    </Router>
  );
}

export default App;
