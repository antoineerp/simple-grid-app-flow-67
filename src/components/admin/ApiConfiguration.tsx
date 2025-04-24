
import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, InfoIcon } from "lucide-react";
import { useApiConfig } from '@/hooks/useApiConfig';
import PermanentApiConfig from './api-config/PermanentApiConfig';

const ApiConfiguration = () => {
  const {
    config,
    loading,
    lastError,
    loadConfig,
    saveConfig,
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
          {lastError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {lastError}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Configuration permanente */}
          <PermanentApiConfig
            config={config}
            loading={loading}
            onInputChange={handleInputChange}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
        <Button variant="outline" onClick={loadConfig} disabled={loading}>
          {loading ? "Chargement..." : "Réinitialiser"}
        </Button>
        <Button onClick={saveConfig} disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer la configuration"}
        </Button>
      </CardFooter>

      <div className="px-6 pb-6">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Après avoir modifié la configuration permanente, vous devrez redémarrer le serveur pour que les changements prennent effet.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
};

export default ApiConfiguration;
