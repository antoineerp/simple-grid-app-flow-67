
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiUrl } from '@/config/apiConfig';
import { Loader2 } from 'lucide-react';

export default function DbConnectionTest() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const runDbTest = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const API_URL = getApiUrl();
      const testEndpoint = `${API_URL}/direct-db-test.php`;
      
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
      setTestResult(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test de connexion directe à la base de données</CardTitle>
      </CardHeader>
      <CardContent>
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
            <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
              <p className="font-semibold">Erreur:</p>
              <p>{errorMessage}</p>
            </div>
          )}
          
          {testResult && (
            <div className="p-4 border bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Résultat du test:</h3>
              <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-4">
            <p>Cette page permet de tester directement la connexion à la base de données MySQL Infomaniak.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
