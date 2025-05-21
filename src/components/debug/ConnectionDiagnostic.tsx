
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DatabaseIcon, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';

/**
 * Composant de diagnostic pour tester les connexions et la récupération des données
 */
const ConnectionDiagnostic: React.FC = () => {
  // États pour stocker les résultats des différents tests
  const [currentUser, setCurrentUser] = useState<string>('');
  const [endpoints, setEndpoints] = useState<any>({});
  const [storageData, setStorageData] = useState<any>({});
  const [apiResponses, setApiResponses] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('user');

  // Récupérer l'utilisateur actuel et effectuer un test initial au chargement
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    runBasicTests();
  }, []);

  // Test des endpoints de l'API
  const testEndpoints = async () => {
    setLoading(true);
    
    try {
      // Liste des endpoints à tester
      const endpointsToTest = [
        'check-users.php',
        'diagnose-connection.php',
        'login.php',
        'db-info.php'
      ];
      
      const results: Record<string, any> = {};
      const apiUrl = getApiUrl();
      
      // Tester chaque endpoint
      for (const endpoint of endpointsToTest) {
        try {
          console.log(`Testing endpoint: ${apiUrl}/${endpoint}`);
          const response = await fetch(`${apiUrl}/${endpoint}?userId=${currentUser}`, {
            method: 'GET',
            headers: {
              ...getAuthHeaders(),
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          const contentType = response.headers.get('content-type');
          const isJson = contentType?.includes('application/json');
          
          let data: any;
          try {
            if (isJson) {
              data = await response.json();
            } else {
              data = await response.text();
            }
          } catch (error) {
            data = `Erreur de parsing: ${error instanceof Error ? error.message : String(error)}`;
          }
          
          results[endpoint] = {
            status: response.status,
            ok: response.ok,
            contentType,
            isJson,
            data
          };
        } catch (error) {
          results[endpoint] = {
            error: true,
            message: error instanceof Error ? error.message : String(error)
          };
        }
      }
      
      setEndpoints(results);
      return results;
    } catch (error) {
      console.error('Erreur lors du test des endpoints:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    } finally {
      setLoading(false);
    }
  };

  // Collecte des données du localStorage
  const collectLocalStorageData = () => {
    const data: Record<string, any> = {};
    const userId = getCurrentUser();
    
    // Catégories de données à collecter
    const keyPrefixes = [
      'documents_', 'exigences_', 'membres_',
      'collaboration_', 'bibliotheque_',
      'sync_'
    ];
    
    // Collecter tous les éléments du localStorage qui correspondent à ces préfixes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const matchesPrefix = keyPrefixes.some(prefix => key.startsWith(prefix));
        const matchesUser = key.includes(userId);
        
        if (matchesPrefix) {
          try {
            const value = localStorage.getItem(key);
            data[key] = {
              value: value ? JSON.parse(value) : null,
              matchesCurrentUser: matchesUser
            };
          } catch (error) {
            data[key] = {
              value: localStorage.getItem(key),
              error: 'Impossible de parser JSON',
              matchesCurrentUser: matchesUser
            };
          }
        }
      }
    }
    
    setStorageData(data);
    return data;
  };

  // Test direct des API de récupération de données
  const testDataRetrieval = async () => {
    setLoading(true);
    
    try {
      const apiUrl = getApiUrl();
      const userId = getCurrentUser();
      const results: Record<string, any> = {};
      
      // Test de récupération des utilisateurs via l'API
      try {
        const usersResponse = await fetch(`${apiUrl}/check-users.php?userId=${userId}`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        results.users = await usersResponse.json();
      } catch (error) {
        results.users = {
          error: true,
          message: error instanceof Error ? error.message : String(error)
        };
      }
      
      // Vérification d'une table spécifique (documents par exemple)
      try {
        // Vérifier si la table est spécifique à l'utilisateur
        const checkTableResponse = await fetch(`${apiUrl}/db-check-table.php?table=documents&userId=${userId}`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        results.tableCheck = await checkTableResponse.json();
      } catch (error) {
        results.tableCheck = {
          error: true,
          message: error instanceof Error ? error.message : String(error)
        };
      }
      
      setApiResponses(results);
      return results;
    } catch (error) {
      console.error('Erreur lors du test de récupération des données:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    } finally {
      setLoading(false);
    }
  };

  // Exécute tous les tests de base
  const runBasicTests = async () => {
    setLoading(true);
    
    try {
      // Récupérer l'utilisateur actuel
      const user = getCurrentUser();
      setCurrentUser(user);
      
      // Collecter les données du localStorage
      collectLocalStorageData();
      
      // Tester les endpoints
      await testEndpoints();
      
      toast({
        title: "Diagnostics terminés",
        description: `Tests effectués pour l'utilisateur: ${user}`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'exécution des tests de base:', error);
      toast({
        variant: "destructive",
        title: "Erreur lors des diagnostics",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour exécuter tous les tests
  const runAllTests = async () => {
    setLoading(true);
    
    try {
      await runBasicTests();
      await testDataRetrieval();
      
      toast({
        title: "Tous les tests terminés",
        description: "Vérifiez les résultats dans chaque onglet",
      });
    } catch (error) {
      console.error('Erreur lors de l\'exécution de tous les tests:', error);
      toast({
        variant: "destructive",
        title: "Erreur lors des tests",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Formater les données JSON pour l'affichage
  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `Erreur de formatage: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>Diagnostic de connexion utilisateur</div>
            <Badge variant="outline">v1.0</Badge>
          </CardTitle>
          <CardDescription>
            Vérification de la récupération des données pour l'utilisateur connecté
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Utilisateur actuel:</strong> {currentUser || "Non connecté"}
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              onClick={runAllTests}
              disabled={loading}
              className="flex items-center"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Exécuter tous les tests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testEndpoints}
              disabled={loading}
            >
              Tester les endpoints
            </Button>
            
            <Button 
              variant="outline" 
              onClick={collectLocalStorageData}
              disabled={loading}
            >
              Analyser le localStorage
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testDataRetrieval}
              disabled={loading}
            >
              Tester la récupération des données
            </Button>
          </div>
          
          <Tabs 
            defaultValue="user" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="user">Utilisateur</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="storage">Données locales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user" className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Informations utilisateur</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">ID utilisateur:</p>
                    <p className="text-sm font-mono">{currentUser}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">URL API:</p>
                    <p className="text-sm font-mono">{getFullApiUrl()}</p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Résultats des requêtes API</h3>
                {Object.keys(apiResponses).length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded">
                      {formatJson(apiResponses)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-gray-500">Exécutez le test de récupération des données pour voir les résultats.</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="endpoints">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Statut des endpoints</h3>
                
                {Object.keys(endpoints).length === 0 ? (
                  <p className="text-gray-500">Exécutez le test des endpoints pour voir les résultats.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(endpoints).map(([endpoint, data]: [string, any]) => (
                      <div key={endpoint} className="border p-3 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{endpoint}</h4>
                          {data.ok ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> OK ({data.status})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Erreur ({data.error ? "Connexion" : data.status})
                            </Badge>
                          )}
                        </div>
                        
                        <ScrollArea className="h-[150px]">
                          <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
                            {formatJson(data)}
                          </pre>
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="storage">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Données du localStorage</h3>
                <p className="text-sm mb-4">
                  Les entrées surlignées en vert appartiennent à l'utilisateur actuel ({currentUser})
                </p>
                
                {Object.keys(storageData).length === 0 ? (
                  <p className="text-gray-500">Exécutez l'analyse du localStorage pour voir les données.</p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {Object.entries(storageData).map(([key, data]: [string, any]) => (
                        <div 
                          key={key} 
                          className={`border p-3 rounded-md ${data.matchesCurrentUser ? 'bg-green-50 border-green-200' : ''}`}
                        >
                          <p className="font-mono text-sm mb-1">{key}</p>
                          <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-[100px] overflow-auto">
                            {formatJson(data.value)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-xs text-gray-500">
            Cette page affiche les données de diagnostic pour l'utilisateur connecté
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center"
            onClick={runBasicTests}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Rafraîchir
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConnectionDiagnostic;
