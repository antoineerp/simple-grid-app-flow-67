
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { robustSync, verifyJsonEndpoint } from "@/services/sync/robustSyncService";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

/**
 * Composant pour tester et déboguer la synchronisation
 */
const SyncTester: React.FC = () => {
  const [isJsonEndpointValid, setIsJsonEndpointValid] = useState<boolean | null>(null);
  const [testSyncResult, setTestSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isPerformingSync, setIsPerformingSync] = useState(false);

  // Vérifier le point de terminaison JSON au chargement
  useEffect(() => {
    const checkEndpoint = async () => {
      const result = await verifyJsonEndpoint();
      setIsJsonEndpointValid(result);
    };
    
    checkEndpoint();
  }, []);

  // Test de synchronisation simple
  const handleTestSync = async () => {
    setIsTesting(true);
    setTestSyncResult(null);
    
    try {
      // Génération de données de test
      const testData = Array.from({ length: 5 }, (_, i) => ({
        id: `test-${Date.now()}-${i}`,
        name: `Test Item ${i+1}`,
        value: Math.random().toString(36).substring(2),
        testDate: new Date().toISOString()
      }));
      
      const result = await robustSync.syncData('test_sync', testData, { silent: true });
      setTestSyncResult(result);
    } catch (error) {
      setTestSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Effectuer une synchronisation complète
  const handleFullSync = async () => {
    setIsPerformingSync(true);
    
    try {
      // À remplacer par un appel à votre système de synchronisation global
      const testData = [{ id: 'global-sync-test', timestamp: Date.now() }];
      await robustSync.syncData('global_sync', testData);
      
      // Notifier l'utilisateur que la synchronisation est terminée
      dispatchEvent(new CustomEvent('force-sync-required'));
    } finally {
      setIsPerformingSync(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Testeur de synchronisation</CardTitle>
        <CardDescription>
          Diagnostiquez et testez la communication avec le serveur
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* État du point de terminaison JSON */}
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
          <span>Point de terminaison JSON:</span>
          {isJsonEndpointValid === null ? (
            <span className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Vérification...
            </span>
          ) : isJsonEndpointValid ? (
            <span className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" /> Fonctionnel
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-2" /> Non fonctionnel
            </span>
          )}
        </div>
        
        {/* Résultats du test */}
        {testSyncResult && (
          <Alert variant={testSyncResult.success ? "default" : "destructive"}>
            <AlertTitle className="flex items-center">
              {testSyncResult.success ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              {testSyncResult.success ? "Test réussi" : "Test échoué"}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {testSyncResult.message}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Message d'avertissement si problème détecté */}
        {isJsonEndpointValid === false && (
          <Alert variant="destructive">
            <AlertTitle className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" /> Problème de communication
            </AlertTitle>
            <AlertDescription className="mt-2">
              Le serveur ne répond pas correctement en format JSON. Cela peut être dû à:
              <ul className="list-disc ml-5 mt-2">
                <li>Un problème de configuration du serveur</li>
                <li>Un problème d'en-têtes HTTP</li>
                <li>Une redirection vers une page d'erreur</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleTestSync}
          disabled={isTesting}
        >
          {isTesting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Tester la synchronisation
        </Button>
        
        <Button 
          variant="default" 
          onClick={handleFullSync}
          disabled={isPerformingSync}
        >
          {isPerformingSync && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Synchronisation complète
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SyncTester;
