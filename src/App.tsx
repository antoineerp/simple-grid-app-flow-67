
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Pilotage from "./pages/Pilotage";
import Exigences from "./pages/Exigences";
import GestionDocumentaire from "./pages/GestionDocumentaire";
import RessourcesHumaines from "./pages/RessourcesHumaines";
import Collaboration from "./pages/Collaboration";
import Administration from "./pages/Administration";
import NotFound from "./pages/NotFound";
import { MembresProvider } from "./contexts/MembresContext";
import { CollaborationProvider } from "./contexts/CollaborationContext";
import BootLoader from "./components/system/BootLoader";

// Création d'un queryClient stable qui ne sera pas recréé à chaque rendu
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    },
  },
});

// Composant d'erreur de secours
const ErrorFallback = () => (
  <div className="flex items-center justify-center min-h-screen flex-col p-4">
    <h2 className="text-xl font-semibold text-red-600 mb-2">Une erreur s'est produite</h2>
    <p className="mb-4">L'application a rencontré une erreur inattendue.</p>
    <button 
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Rafraîchir la page
    </button>
  </div>
);

// Composant de chargement
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MembresProvider>
          <CollaborationProvider>
            <Suspense fallback={<LoadingFallback />}>
              <BootLoader>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Index />} />
                      <Route path="pilotage" element={<Pilotage />} />
                      <Route path="exigences" element={<Exigences />} />
                      <Route path="gestion-documentaire" element={<GestionDocumentaire />} />
                      <Route path="ressources-humaines" element={<RessourcesHumaines />} />
                      <Route path="collaboration" element={<Collaboration />} />
                      <Route path="administration" element={<Administration />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </BootLoader>
            </Suspense>
            <Toaster />
            <Sonner />
          </CollaborationProvider>
        </MembresProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
