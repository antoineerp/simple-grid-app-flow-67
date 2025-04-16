
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="pilotage" element={<Pilotage />} />
            <Route path="exigences" element={<Exigences />} />
            <Route path="gestion-documentaire" element={<GestionDocumentaire />} />
            <Route path="ressources-humaines" element={<RessourcesHumaines />} />
            <Route path="bibliotheque" element={<Bibliotheque />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
