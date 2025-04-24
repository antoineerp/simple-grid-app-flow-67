
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
      const response = await fetch(`${API_URL}/config`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        console.log("Configuration chargée:", data);
      } else {
        const error = await response.json();
        const errorMsg = error.message || "Erreur lors du chargement de la configuration";
        setLastError(errorMsg);
        throw new Error(errorMsg);
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
        body: JSON.stringify(config)
      });
      
      const responseText = await response.text();
      console.log("Réponse brute:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Réponse non-JSON: ${responseText}`);
      }
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Configuration mise à jour avec succès",
        });
      } else {
        const errorMsg = responseData.message || responseData.details || "Erreur lors de la sauvegarde de la configuration";
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

  return {
    config,
    loading,
    lastError,
    loadConfig,
    saveConfig,
    handleInputChange
  };
};
