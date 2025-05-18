
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiUrl } from '@/config/apiConfig';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DbConnectionTest() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const runDbTest = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const API_URL = getApiUrl();
      // Utiliser uniquement l'endpoint unifié
      const testEndpoint = `${API_URL}/test-db-connection.php`;
      console.log(`Exécution du test de connexion à: ${testEndpoint}`);
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Résultat du test de connexion:", result);
      setTestResult(result);
      
      // Vérifier si la connexion à la base de données est réussie
      if (result.status !== 'success') {
        const dbError = result.message || result.error || "Échec de connexion sans message d'erreur";
        setErrorMessage(`Échec de la connexion à la base de données: ${dbError}`);
      }
      
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button onClick={runDbTest} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test en cours...
            </>
          ) : "Tester la connexion"}
        </Button>
        <Button onClick={() => window.location.href = '/db-admin'} variant="outline">
          Administration BDD
        </Button>
      </div>
      
      {errorMessage && (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">Erreur:</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}
      
      {testResult && !errorMessage && (
        <div className="p-4 border bg-green-50 border-green-200 rounded-md flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Connexion réussie!</p>
            <p className="text-green-700">
              {testResult.database?.version ? 
                `MySQL version: ${testResult.database.version}` : 
                'Base de données connectée'}
            </p>
            {testResult.tables?.utilisateurs_count !== undefined && (
              <p className="text-green-700 mt-1">
                {testResult.tables.utilisateurs_count} utilisateur(s) trouvé(s)
              </p>
            )}
          </div>
        </div>
      )}
      
      {testResult && (
        <div className="p-4 border bg-gray-50 rounded-md">
          <h3 className="font-semibold mb-2">Détails du test:</h3>
          <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded text-sm max-h-60 overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="text-sm text-gray-500 mt-4">
        <p>Cette page permet de tester directement la connexion à la base de données MySQL.</p>
      </div>
    </div>
  );
}
