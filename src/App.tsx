import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '@/pages/Login';
import Layout from '@/components/Layout';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import Admin from '@/pages/Admin';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Collaboration from '@/pages/Collaboration';
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<GestionDocumentaire />} />
          <Route path="ressources-humaines" element={<RessourcesHumaines />} />
          <Route path="collaboration" element={<Collaboration />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
