
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { SyncProvider } from "@/hooks/useSyncContext";

// Layouts
import MainLayout from "@/components/layouts/MainLayout";

// Pages
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import MembresPage from "@/pages/Membres";
import Bibliotheque from "@/pages/Bibliotheque";
import SettingsPage from "@/pages/Settings";
import ExigencesPage from "@/pages/Exigences";
import Pilotage from '@/pages/Pilotage';
import Database from '@/pages/admin/Database';
import SyncManagement from '@/pages/admin/SyncManagement';
import GlobalSyncManager from "@/components/common/GlobalSyncManager";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="qualite-theme">
      <BrowserRouter>
        <AuthProvider>
          <SyncProvider options={{ showToasts: true }}>
            <GlobalSyncManager />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="membres" element={<MembresPage />} />
                <Route path="exigences" element={<ExigencesPage />} />
                <Route path="bibliotheque" element={<Bibliotheque />} />
                <Route path="pilotage" element={<Pilotage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin">
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="database" element={<Database />} />
                  <Route path="sync" element={<SyncManagement />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </SyncProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
