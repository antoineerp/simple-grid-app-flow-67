
import { useState, useEffect } from "react";
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
import Bibliotheque from "./pages/Bibliotheque";
import Administration from "./pages/Administration";
import NotFound from "./pages/NotFound";
import ServerTest from "./components/ServerTest";
import _ from 'lodash';

// S'assurer que lodash est correctement configuré
if (!_) {
  console.error("Lodash n'est pas correctement chargé!");
}

// Créer le queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  }
});

const App = () => {
  const [isError, setIsError] = useState(false);
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    // Vérifier si lodash est correctement chargé
    if (typeof _.map !== 'function') {
      setIsError(true);
      setErrorDetails("La bibliothèque Lodash n'est pas correctement chargée. Veuillez actualiser la page.");
    }
  }, []);

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 text-2xl font-bold mb-4">Erreur de chargement</div>
          <div className="text-gray-800 mb-6">{errorDetails}</div>
          <div className="flex flex-col space-y-4">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Actualiser la page
            </button>
            <button 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => {
                // Effacer le cache avant de recharger
                localStorage.removeItem('appCache');
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Actualiser et effacer le cache
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="pilotage" element={<Pilotage />} />
              <Route path="exigences" element={<Exigences />} />
              <Route path="gestion-documentaire" element={<GestionDocumentaire />} />
              <Route path="ressources-humaines" element={<RessourcesHumaines />} />
              <Route path="bibliotheque" element={<Bibliotheque />} />
              <Route path="collaboration" element={<Bibliotheque />} />
              <Route path="administration" element={<Administration />} />
              <Route path="server-test" element={<ServerTest />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
