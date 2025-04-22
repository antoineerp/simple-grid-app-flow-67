
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Database, Server } from "lucide-react";
import { getApiUrl } from '@/config/apiConfig';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAuthHeaders } from '@/services/auth/authService';

const ServerTest = () => {
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [dbMessage, setDbMessage] = useState<string>('');

  const testApiConnection = async () => {
    setApiStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing API connection to:", API_URL + '/test.php');
      
      const response = await fetch(`${API_URL}/test.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      setApiMessage(`Connexion API réussie (${data.message || 'Pas de message'})`);
      setApiStatus('success');
    } catch (error) {
      console.error("Erreur API:", error);
      setApiMessage(`Échec de la connexion API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setApiStatus('error');
    }
  };

  const testDatabaseConnection = async () => {
    setDbStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing database connection to:", API_URL + '/database-test');
      
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        // Tenter de lire le message d'erreur quand même
        const errorText = await response.text();
        console.error("Erreur de base de données (texte brut):", errorText);
        
        try {
          // Essayer de parser le message d'erreur comme JSON
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Status: ${response.status}`);
        } catch (parseError) {
          // Si le parsing échoue, utiliser le message d'erreur brut
          throw new Error(`Status: ${response.status}, Réponse: ${errorText.substring(0, 100)}...`);
        }
      }
      
      const data = await response.json();
      console.log("Database response:", data);
      
      setDbMessage(`Connexion DB réussie (${data.message || 'Pas de message'})`);
      setDbStatus('success');
    } catch (error) {
      console.error("Erreur DB:", error);
      setDbMessage(`Échec de la connexion DB: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setDbStatus('error');
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Test de connexion</CardTitle>
        <CardDescription>Vérifier la connexion au serveur API et à la base de données</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Connexion à l'API:
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testApiConnection}
              disabled={apiStatus === 'loading'}
            >
              {apiStatus === 'loading' ? 'Test en cours...' : 'Tester'}
            </Button>
          </div>
          
          {apiStatus !== 'idle' && (
            <Alert variant={apiStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
              <div className="flex items-start">
                {apiStatus === 'success' ? 
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5" /> : 
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                }
                <div>
                  <AlertTitle>{apiStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                  <AlertDescription>{apiMessage}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Connexion à la base de données:
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testDatabaseConnection} 
              disabled={dbStatus === 'loading'}
            >
              {dbStatus === 'loading' ? 'Test en cours...' : 'Tester'}
            </Button>
          </div>
          
          {dbStatus !== 'idle' && (
            <Alert variant={dbStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
              <div className="flex items-start">
                {dbStatus === 'success' ? 
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5" /> : 
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                }
                <div>
                  <AlertTitle>{dbStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                  <AlertDescription>{dbMessage}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <div className="text-xs text-muted-foreground">
          API URL: {getApiUrl()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ServerTest;
