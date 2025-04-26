
import { useState } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import { ApiConfig } from '@/types/api-config';

export const useConfigOperations = (config: ApiConfig, setConfig: (config: ApiConfig) => void) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setLastError(null);
    try {
      const API_URL = getApiUrl();
      console.log(`Chargement de la configuration API depuis: ${API_URL}/config`);
      
      const response = await fetch(`${API_URL}/config`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      const responseText = await response.text();
      
      if (!responseText.trim()) {
        throw new Error("Réponse vide du serveur");
      }
      
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
          responseText.trim().toLowerCase().startsWith('<html')) {
        console.error("Réponse HTML reçue:", responseText.substring(0, 200));
        throw new Error("Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration du serveur.");
      }
      
      try {
        const data = JSON.parse(responseText);
        setConfig(data);
        console.log("Configuration chargée:", data);
      } catch (jsonError) {
        console.error("Erreur de parsing JSON:", jsonError, "Texte reçu:", responseText.substring(0, 200));
        throw new Error(`La réponse n'est pas un JSON valide: ${responseText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error("Erreur:", error);
      const errorMsg = error instanceof Error ? error.message : "Impossible de charger la configuration";
      setLastError(errorMsg);
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
      
      console.info("Suggestion: testez l'API directement avec: " + getApiUrl() + "/simple-json-test.php");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setLastError(null);
    try {
      console.log("Sauvegarde de la configuration:", config);
      
      const API_URL = getApiUrl();
      console.log("URL API utilisée:", `${API_URL}/config`);
      
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      };
      console.log("En-têtes utilisés:", headers);
      
      const response = await fetch(`${API_URL}/config`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(config),
        cache: 'no-store'
      });
      
      const responseText = await response.text();
      console.log("Réponse brute:", responseText);
      
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
          responseText.trim().toLowerCase().startsWith('<html')) {
        console.error("Réponse HTML reçue:", responseText.substring(0, 200));
        throw new Error("Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration du serveur.");
      }
      
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Échec du parsing JSON:", e);
        if (response.ok) {
          toast({
            title: "Succès",
            description: "Configuration mise à jour (bien que la réponse ne soit pas du JSON)",
          });
          return;
        } else {
          throw new Error(`Réponse non-JSON: ${responseText}`);
        }
      }
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Configuration mise à jour avec succès",
        });
      } else {
        const errorMsg = responseData?.message || responseData?.details || "Erreur lors de la sauvegarde de la configuration";
        setLastError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      const errorMsg = error instanceof Error ? error.message : "Impossible de sauvegarder la configuration";
      setLastError(errorMsg);
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    lastError,
    loadConfig,
    saveConfig
  };
};
