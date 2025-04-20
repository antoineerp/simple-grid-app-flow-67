
import React, { useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

const AssetDiagnostics = () => {
  const { toast } = useToast();

  const checkAssets = async () => {
    try {
      const response = await fetch('/assets-check.php', {
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      });
      const data = await response.text();
      console.log("Diagnostic des assets:", data);

      if (data.includes("Assets directory: Missing") || data.includes("index.js: Missing")) {
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Les fichiers de build sont manquants. Exécutez 'npm run build'.",
        });
      }
    } catch (err) {
      console.error("Erreur de diagnostic assets:", err);
      toast({
        variant: "destructive",
        title: "Erreur de diagnostic",
        description: "Impossible de vérifier l'état des assets.",
      });
    }
  };

  useEffect(() => {
    checkAssets();
  }, []);

  return null;
};

export default AssetDiagnostics;
