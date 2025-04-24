
import { useState } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";

export interface ApiConfig {
  api_urls: {
    development: string;
    production: string;
  };
  allowed_origins: {
    development: string;
    production: string;
  };
}

export const useApiConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ApiConfig>({
    api_urls: {
      development: 'http://localhost:8080/api',
      production: 'https://qualiopi.ch/api'
    },
    allowed_origins: {
      development: 'http://localhost:8080',
      production: 'https://qualiopi.ch'
    }
  });
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Charger la configuration depuis l'API
  const loadConfig = async () => {
    setLoading(true);
    setLastError(null);
    try {
      const API_URL = getApiUrl();
      console.log(`Chargement de la configuration API depuis: ${API_URL}/config`);
      
      const response = await fetch(`${API_URL}/config`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store' // Ne pas utiliser de cache
      });
      
      // Récupérer d'abord le contenu brut pour vérifier qu'il s'agit de JSON valide
      const responseText = await response.text();
      
      // Vérifier si la réponse est vide
      if (!responseText.trim()) {
        throw new Error("Réponse vide du serveur");
      }
      
      // Vérifier si la réponse est du HTML au lieu du JSON
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
      
      // Suggérer un diagnostic
      console.info("Suggestion: testez l'API directement avec: " + getApiUrl() + "/json-test.php");
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder la configuration
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
        cache: 'no-store' // Ne pas utiliser de cache
      });
      
      const responseText = await response.text();
      console.log("Réponse brute:", responseText);
      
      // Vérifier si la réponse est du HTML
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
          responseText.trim().toLowerCase().startsWith('<html')) {
        console.error("Réponse HTML reçue:", responseText.substring(0, 200));
        throw new Error("Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration du serveur.");
      }
      
      // Analyser la réponse JSON
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Échec du parsing JSON:", e);
        if (response.ok) {
          // Si la réponse est OK mais pas du JSON, on peut quand même considérer que ça a marché
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

  // Mettre à jour les inputs lorsque la configuration change
  const handleInputChange = (
    section: 'api_urls' | 'allowed_origins',
    env: 'development' | 'production',
    value: string
  ) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [env]: value
      }
    }));
  };
  
  // Tester la réponse JSON pure
  const testJsonFormat = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/json-test.php`);
      const text = await response.text();
      
      try {
        JSON.parse(text);
        toast({
          title: "Test JSON réussi",
          description: "Le serveur répond avec du JSON valide",
        });
      } catch (e) {
        toast({
          title: "Test JSON échoué",
          description: "Le serveur ne répond pas avec du JSON valide",
          variant: "destructive",
        });
      }
      
      return { success: true, response: text };
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Impossible de contacter le serveur",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    lastError,
    loadConfig,
    saveConfig,
    handleInputChange,
    testJsonFormat
  };
};
