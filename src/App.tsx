
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '@/pages/Login';
import Layout from '@/components/layout/Layout';
import GestionDocumentaire from '@/pages/GestionDocumentaire';
import Admin from '@/pages/Admin';
import RessourcesHumaines from '@/pages/RessourcesHumaines';
import Collaboration from '@/pages/Collaboration';
import { Toaster } from "@/components/ui/toaster";
import { MembresProvider } from '@/contexts/MembresContext';
import Pilotage from '@/pages/Pilotage';
import Exigences from '@/pages/Exigences';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pilotage" element={
          <MembresProvider>
            <Layout />
          </MembresProvider>
        }>
          <Route index element={<Pilotage />} />
          <Route path="exigences" element={<Exigences />} />
          <Route path="ressources-humaines" element={<RessourcesHumaines />} />
          <Route path="collaboration" element={<Collaboration />} />
          <Route path="gestion-documentaire" element={<GestionDocumentaire />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
