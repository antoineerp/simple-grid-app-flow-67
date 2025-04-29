import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, AlertCircle, CheckCircle, AlertTriangle, FileCode } from "lucide-react";
import { getApiUrl } from '@/config/apiConfig';
import { parseFetchResponse } from '@/utils/jsonValidator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DbConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("result");
  
  const testDirectConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRawResponse(null);
    
    try {
      const API_URL = getApiUrl();
      console.log("Testing direct DB connection using:", `${API_URL}/direct-db-test.php`);
      
      const response = await fetch(`${API_URL}/direct-db-test.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Journaliser les informations sur la réponse
      console.log("Statut de réponse:", response.status, response.statusText);
      console.log("Content-Type:", response.headers.get('content-type'));
      
      const text = await response.text();
      console.log("Raw response (first 300 chars):", text.substring(0, 300));
      
      // Sauvegarder la réponse brute
      setRawResponse(text);
      
      // Vérifier si la réponse semble être du HTML au lieu de JSON
      if (text.includes('<br />') || text.includes('<b>') || 
          text.includes('<!DOCTYPE') || text.includes('<html')) {
        
        setError(`La réponse est du HTML au lieu de JSON. Cela indique généralement une erreur PHP. Consultez l'onglet "Réponse brute" pour plus de détails.`);
        
        // Essayer d'extraire un message d'erreur PHP si possible
        const errorMatch = text.match(/<b>([^<]+)<\/b>/);
        if (errorMatch && errorMatch[1]) {
          setError(`Erreur PHP: ${errorMatch[1]}`);
        }
      } else {
        try {
          const data = JSON.parse(text);
          console.log("Parsed response:", data);
          setResult(data);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
          setError(`La réponse n'est pas au format JSON valide. Consultez l'onglet "Réponse brute" pour plus de détails.`);
        }
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
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="result">Résultat</TabsTrigger>
              <TabsTrigger value="raw">Réponse brute</TabsTrigger>
            </TabsList>
            
            <TabsContent value="result">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur de connexion</AlertTitle>
                  <AlertDescription className="mt-2">
                    {error}
                    {rawResponse && rawResponse.includes('<br />') && (
                      <p className="text-sm mt-2">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Une erreur PHP a été détectée. Vérifiez l'onglet "Réponse brute" pour les détails.
                      </p>
                    )}
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
                          <ul className="list-disc pl-5 text-sm max-h-40 overflow-y-auto">
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
                  {rawResponse ? (
                    <div className="text-center">
                      <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                      <p>Réponse reçue mais impossible de l'interpréter.</p>
                      <p className="text-sm mt-2">Consultez l'onglet "Réponse brute" pour plus de détails.</p>
                    </div>
                  ) : (
                    <p>Cliquez sur le bouton pour tester la connexion à la base de données</p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="raw">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Réponse brute du serveur</h3>
                  <div className="text-xs text-muted-foreground">
                    {rawResponse ? `${rawResponse.length} caractères` : "Aucune donnée"}
                  </div>
                </div>
                
                <div className="border rounded-md p-4 bg-slate-50 overflow-x-auto">
                  {rawResponse ? (
                    <pre className="text-xs whitespace-pre-wrap break-words">{rawResponse}</pre>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCode className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Aucune donnée disponible</p>
                    </div>
                  )}
                </div>
                
                {rawResponse && (
                  <div className="text-xs mt-2 text-muted-foreground">
                    <p className="flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" /> 
                      Si vous voyez des balises HTML comme <code>&lt;br /&gt;</code> ou <code>&lt;b&gt;</code>, 
                      c'est probablement une erreur PHP affichée au lieu de JSON.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
