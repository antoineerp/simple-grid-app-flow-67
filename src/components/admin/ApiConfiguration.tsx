
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiUrl, setCustomApiUrl, resetToDefaultApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";

interface ApiConfig {
  api_urls: {
    development: string;
    production: string;
  };
  allowed_origins: {
    development: string;
    production: string;
  };
}

const ApiConfiguration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ApiConfig>({
    api_urls: {
      development: 'http://localhost:8080/api',
      production: 'https://www.qualiopi.ch/api'
    },
    allowed_origins: {
      development: 'http://localhost:8080',
      production: 'https://www.qualiopi.ch'
    }
  });
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState(getApiUrl());
  const [useCustomUrl, setUseCustomUrl] = useState(!!localStorage.getItem('customApiUrl'));

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

  // Charger la configuration au chargement du composant
  useEffect(() => {
    loadConfig();
  }, []);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de l'API</CardTitle>
        <CardDescription>Gérez les URLs et les origines autorisées pour l'API</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Configuration temporaire (pour cette session uniquement) */}
          <div className="space-y-4 p-4 border rounded-md bg-slate-50">
            <h3 className="text-lg font-medium">Configuration temporaire (cette session uniquement)</h3>
            <p className="text-sm text-gray-500">Cette configuration est stockée dans le navigateur et n'affecte que votre session actuelle</p>
            
            <div className="grid gap-3">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="custom-url">URL de l'API personnalisée</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="custom-url" 
                    value={customUrl}
                    onChange={handleCustomUrlChange}
                    disabled={loading}
                  />
                  <Button onClick={toggleCustomUrl} variant={useCustomUrl ? "destructive" : "default"}>
                    {useCustomUrl ? "Désactiver" : "Activer"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL actuelle: <span className="font-mono">{getApiUrl()}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Configuration permanente */}
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-medium">Configuration permanente</h3>
            <p className="text-sm text-gray-500">Cette configuration est enregistrée sur le serveur et s'applique à tous les utilisateurs</p>
            
            <div className="grid gap-6">
              <div>
                <h4 className="text-md font-medium mb-2">URLs de l'API</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="api-dev">Développement</Label>
                    <Input 
                      id="api-dev"
                      value={config.api_urls.development}
                      onChange={(e) => handleInputChange('api_urls', 'development', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="api-prod">Production</Label>
                    <Input 
                      id="api-prod"
                      value={config.api_urls.production}
                      onChange={(e) => handleInputChange('api_urls', 'production', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2">Origines autorisées (CORS)</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="origin-dev">Développement</Label>
                    <Input 
                      id="origin-dev"
                      value={config.allowed_origins.development}
                      onChange={(e) => handleInputChange('allowed_origins', 'development', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="origin-prod">Production</Label>
                    <Input 
                      id="origin-prod"
                      value={config.allowed_origins.production}
                      onChange={(e) => handleInputChange('allowed_origins', 'production', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertDescription>
              Après avoir modifié la configuration permanente, vous devrez redémarrer le serveur pour que les changements prennent effet.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={loadConfig} disabled={loading}>
          Réinitialiser
        </Button>
        <Button onClick={saveConfig} disabled={loading}>
          Enregistrer la configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiConfiguration;
