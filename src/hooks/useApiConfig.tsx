
import { useState } from 'react';
import { getApiUrl, setCustomApiUrl, resetToDefaultApiUrl, isUsingCustomApiUrl, getFullApiUrl } from '@/config/apiConfig';
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
  const [customUrl, setCustomUrl] = useState(getFullApiUrl());
  const [useCustomUrl, setUseCustomUrl] = useState(isUsingCustomApiUrl());

  // Charger la configuration depuis l'API
  const loadConfig = async () => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/config`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du chargement de la configuration");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder la configuration
  const saveConfig = async () => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/config`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Configuration mise à jour avec succès",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la sauvegarde de la configuration");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement d'URL personnalisée
  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomUrl(e.target.value);
  };

  // Activer/désactiver l'URL personnalisée
  const toggleCustomUrl = () => {
    if (useCustomUrl) {
      // Désactiver l'URL personnalisée
      resetToDefaultApiUrl();
      setUseCustomUrl(false);
      setCustomUrl(window.location.origin + '/api'); // Réinitialiser l'input avec l'URL par défaut
      toast({
        title: "URL réinitialisée",
        description: "Utilisation de l'URL par défaut selon l'environnement",
      });
    } else {
      // Activer l'URL personnalisée
      setCustomApiUrl(customUrl);
      setUseCustomUrl(true);
      toast({
        title: "URL personnalisée activée",
        description: "L'application utilisera maintenant l'URL personnalisée",
      });
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
    customUrl,
    useCustomUrl,
    loadConfig,
    saveConfig,
    handleCustomUrlChange,
    toggleCustomUrl,
    handleInputChange
  };
};
