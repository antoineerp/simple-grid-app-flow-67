
import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiConfig } from '@/hooks/useApiConfig';
import TemporaryApiConfig from './api-config/TemporaryApiConfig';
import PermanentApiConfig from './api-config/PermanentApiConfig';

const ApiConfiguration = () => {
  const {
    config,
    loading,
    customUrl,
    useCustomUrl,
    loadConfig,
    saveConfig,
    handleCustomUrlChange,
    toggleCustomUrl,
    handleInputChange
  } = useApiConfig();

  // Charger la configuration au chargement du composant
  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de l'API</CardTitle>
        <CardDescription>Gérez les URLs et les origines autorisées pour l'API</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Configuration temporaire (pour cette session uniquement) */}
          <TemporaryApiConfig
            customUrl={customUrl}
            useCustomUrl={useCustomUrl}
            loading={loading}
            onCustomUrlChange={handleCustomUrlChange}
            onToggleCustomUrl={toggleCustomUrl}
          />

          {/* Configuration permanente */}
          <PermanentApiConfig
            config={config}
            loading={loading}
            onInputChange={handleInputChange}
          />
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
