
import React from 'react'; // Ajout de l'importation de React
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AssetDiagnostics from "./components/diagnostics/AssetDiagnostics";
import InitialLoading from "./components/loading/InitialLoading";
import Index from "./pages/Index";
import Pilotage from "./pages/Pilotage";
import Exigences from "./pages/Exigences";
import GestionDocumentaire from "./pages/GestionDocumentaire";
import RessourcesHumaines from "./pages/RessourcesHumaines";
import Bibliotheque from "./pages/Bibliotheque";
import Administration from "./pages/Administration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AssetDiagnostics />
        <React.Suspense fallback={<InitialLoading />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="pilotage" element={<Pilotage />} />
              <Route path="exigences" element={<Exigences />} />
              <Route path="gestion-documentaire" element={<GestionDocumentaire />} />
              <Route path="ressources-humaines" element={<RessourcesHumaines />} />
              <Route path="bibliotheque" element={<Bibliotheque />} />
              <Route path="administration" element={<Administration />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
