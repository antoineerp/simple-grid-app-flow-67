
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { getApiUrl } from '@/config/apiConfig';

const DbConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testDirectConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const API_URL = getApiUrl();
      console.log("Testing direct DB connection using:", `${API_URL}/direct-db-test.php`);
      
      const response = await fetch(`${API_URL}/direct-db-test.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      const text = await response.text();
      console.log("Raw response:", text);
      
      try {
        const data = JSON.parse(text);
        setResult(data);
      } catch (e) {
        console.error("Error parsing JSON response:", e);
        setError(`La réponse n'est pas au format JSON valide: ${text.substring(0, 100)}...`);
      }
    } catch (err) {
      console.error("Error testing connection:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite lors du test de connexion");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Tester automatiquement au chargement du composant
  useEffect(() => {
    testDirectConnection();
  }, []);
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Test direct de connexion MySQL
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Test de connexion en cours...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de connexion</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
            </AlertDescription>
          </Alert>
        ) : result ? (
          <div className="space-y-4">
            <Alert variant={result.status === 'success' ? 'default' : 'destructive'}>
              {result.status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.status === 'success' ? 'Connexion réussie' : 'Échec de connexion'}
              </AlertTitle>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
            
            {result.status === 'success' && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded">
                  <h3 className="font-medium">Informations MySQL</h3>
                  <p className="text-sm">Version: {result.version}</p>
                </div>
                
                <div className="bg-muted p-3 rounded">
                  <h3 className="font-medium">Tables ({result.tables?.length || 0})</h3>
                  {result.tables && result.tables.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm">
                      {result.tables.map((table: string, index: number) => (
                        <li key={index}>{table}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune table trouvée</p>
                  )}
                </div>
                
                {result.utilisateurs_count !== undefined && (
                  <div className="bg-muted p-3 rounded">
                    <h3 className="font-medium">Utilisateurs ({result.utilisateurs_count})</h3>
                    {result.utilisateurs_sample && result.utilisateurs_sample.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">ID</th>
                              <th className="text-left p-2">Identifiant technique</th>
                              <th className="text-left p-2">Email</th>
                              <th className="text-left p-2">Rôle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.utilisateurs_sample.map((user: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="p-2">{user.id}</td>
                                <td className="p-2">{user.identifiant_technique}</td>
                                <td className="p-2">{user.email}</td>
                                <td className="p-2">{user.role}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {result.error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <h3 className="font-medium text-red-700">Détails de l'erreur</h3>
                <pre className="text-xs overflow-auto p-2 bg-red-100 rounded mt-2">
                  {result.error}
                </pre>
                {result.connection_info && (
                  <div className="mt-2">
                    <h4 className="font-medium text-sm">Informations de connexion</h4>
                    <ul className="list-disc pl-5 text-xs">
                      <li>Hôte: {result.connection_info.host}</li>
                      <li>Base: {result.connection_info.database}</li>
                      <li>Utilisateur: {result.connection_info.username}</li>
                      <li>PHP: {result.connection_info.php_version}</li>
                      <li>Drivers PDO: {result.connection_info.pdo_drivers}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-6 text-muted-foreground">
            Cliquez sur le bouton pour tester la connexion à la base de données
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={testDirectConnection} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? 'Test en cours...' : 'Tester la connexion'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DbConnectionTest;
