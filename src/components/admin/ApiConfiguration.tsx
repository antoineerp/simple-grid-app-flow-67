
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, InfoIcon, Bug, Code } from "lucide-react";
import { useApiConfig } from '@/hooks/useApiConfig';
import PermanentApiConfig from './api-config/PermanentApiConfig';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ApiConfiguration = () => {
  const {
    config,
    loading,
    lastError,
    loadConfig,
    saveConfig,
    handleInputChange,
    testJsonFormat
  } = useApiConfig();
  
  const [jsonTestResult, setJsonTestResult] = useState<string | null>(null);
  const [isTestingJson, setIsTestingJson] = useState(false);

  // Charger la configuration au chargement du composant
  useEffect(() => {
    loadConfig();
  }, []);
  
  // Tester le format JSON de l'API
  const handleTestJson = async () => {
    setIsTestingJson(true);
    try {
      const result = await testJsonFormat();
      if (result.success) {
        setJsonTestResult(typeof result.response === 'string' ? result.response : JSON.stringify(result.response, null, 2));
      } else {
        setJsonTestResult(`Erreur: ${result.error}`);
      }
    } finally {
      setIsTestingJson(false);
    }
  };

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
                <div className="space-y-2">
                  <p>{lastError}</p>
                  
                  {lastError.includes("JSON") && (
                    <div className="p-2 border rounded bg-red-50 mt-2 text-sm">
                      <p className="font-medium">Possible cause:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Le serveur renvoie du HTML au lieu du JSON</li>
                        <li>Erreur PHP non gérée sur le serveur</li>
                        <li>Problème de configuration CORS</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={handleTestJson}
                        disabled={isTestingJson}
                      >
                        <Bug className="mr-2 h-4 w-4" />
                        {isTestingJson ? "Test en cours..." : "Tester la réponse JSON"}
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Configuration permanente */}
          <PermanentApiConfig
            config={config}
            loading={loading}
            onInputChange={handleInputChange}
          />
          
          {/* Outil de diagnostic JSON */}
          {jsonTestResult && (
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="json-test">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center">
                    <Code className="mr-2 h-4 w-4" />
                    Résultat du test JSON
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-muted p-3 rounded-md overflow-auto max-h-60">
                    <pre className="text-xs whitespace-pre-wrap">{jsonTestResult}</pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
        <div className="flex flex-row space-x-2">
          <Button variant="outline" onClick={loadConfig} disabled={loading}>
            {loading ? "Chargement..." : "Réinitialiser"}
          </Button>
          <Button variant="outline" onClick={handleTestJson} disabled={isTestingJson || loading}>
            <Bug className="mr-2 h-4 w-4" />
            {isTestingJson ? "Test en cours..." : "Tester JSON"}
          </Button>
        </div>
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
