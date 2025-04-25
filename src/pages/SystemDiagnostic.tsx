
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Check, X, AlertCircle, Server, FileText, Database, 
  Globe, RefreshCw, FileCode, Coffee
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { fetchWithErrorHandling, getApiUrl } from '@/config/apiConfig';

// Type pour les résultats de diagnostic
interface DiagnosticResult {
  timestamp: string;
  server_info: {
    php: {
      version: string;
      modules: string[];
      has_pdo: boolean;
      has_mysql: boolean;
      has_json: boolean;
      has_mbstring: boolean;
      has_curl: boolean;
      [key: string]: any;
    };
    network: {
      [key: string]: string;
    };
  };
  filesystem: {
    [key: string]: {
      exists: boolean;
      readable?: boolean;
      writable?: boolean;
      file_count?: number;
      size?: number;
    };
  };
  database: {
    status: string;
    message: string;
    host?: string;
    database?: string;
    tables?: string[];
  };
  assets: {
    assets_dir_exists: boolean;
    js_count?: number;
    css_count?: number;
    js_files?: string[];
    css_files?: string[];
  };
  environment?: {
    [key: string]: string;
  };
}

// Test d'exécution PHP simple
interface PhpExecutionResult {
  status: string;
  message: string;
  php_version: string;
  timestamp: string;
  request: {
    method: string;
    uri: string;
    ip: string;
  };
}

// Composant pour afficher les résultats des tests
const SystemDiagnostic: React.FC = () => {
  const [activeTab, setActiveTab] = useState('php');
  const [isRunningCustomTest, setIsRunningCustomTest] = useState(false);
  const [customTestResults, setCustomTestResults] = useState<any>(null);

  // Test PHP de base pour vérifier l'exécution
  const phpExecutionTest = useQuery({
    queryKey: ['phpExecutionTest'],
    queryFn: async () => {
      const url = `${getApiUrl()}/php-execution-test.php`;
      const response = await fetchWithErrorHandling(url);
      return response as PhpExecutionResult;
    }
  });

  // Diagnostics système complets
  const systemDiagnostics = useQuery({
    queryKey: ['systemDiagnostics'],
    queryFn: async () => {
      const url = `${getApiUrl()}/php-system-check.php`;
      const response = await fetchWithErrorHandling(url);
      return response as DiagnosticResult;
    },
    enabled: phpExecutionTest.isSuccess
  });

  // Tester un asset spécifique
  const testAssetLoading = async (assetPath: string) => {
    try {
      setIsRunningCustomTest(true);
      const startTime = performance.now();
      const response = await fetch(assetPath, { cache: 'no-store' });
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      const result = {
        path: assetPath,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        loadTimeMs: loadTime.toFixed(2),
        size: response.headers.get('content-length') || 'inconnu'
      };
      
      setCustomTestResults(result);
      if (response.ok) {
        toast({
          title: "Asset chargé avec succès",
          description: `${assetPath} chargé en ${loadTime.toFixed(2)}ms`,
        });
      } else {
        toast({
          title: "Échec du chargement",
          description: `Erreur ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setCustomTestResults({
        path: assetPath,
        error: errorMessage
      });
      toast({
        title: "Erreur de test",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRunningCustomTest(false);
    }
  };

  // Tester une API spécifique
  const testApiEndpoint = async (endpoint: string) => {
    try {
      setIsRunningCustomTest(true);
      const startTime = performance.now();
      const url = `${getApiUrl()}/${endpoint}`;
      const response = await fetch(url);
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }
      
      const result = {
        endpoint: url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        loadTimeMs: loadTime.toFixed(2),
        data: responseData
      };
      
      setCustomTestResults(result);
      if (response.ok) {
        toast({
          title: "API testée avec succès",
          description: `${endpoint} répondu en ${loadTime.toFixed(2)}ms`,
        });
      } else {
        toast({
          title: "Échec de l'appel API",
          description: `Erreur ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setCustomTestResults({
        endpoint: `${getApiUrl()}/${endpoint}`,
        error: errorMessage
      });
      toast({
        title: "Erreur de test API",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRunningCustomTest(false);
    }
  };

  // Afficher un message si les tests PHP échouent
  useEffect(() => {
    if (phpExecutionTest.isError) {
      toast({
        title: "Erreur PHP critique",
        description: "Impossible d'exécuter les scripts PHP. Vérifiez la configuration du serveur.",
        variant: "destructive",
      });
    }
  }, [phpExecutionTest.isError]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Diagnostic Système</h1>
        <p className="text-gray-600">
          Vérifiez l'état de votre installation, la configuration PHP, les connexions API et les assets
        </p>
      </div>

      {/* Test PHP de base */}
      {phpExecutionTest.isLoading ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coffee className="mr-2 h-5 w-5" />
              Test d'exécution PHP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Vérification de l'exécution PHP...</span>
            </div>
          </CardContent>
        </Card>
      ) : phpExecutionTest.isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur critique</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Le serveur ne parvient pas à exécuter les scripts PHP correctement.</p>
            <p className="text-sm">
              Vérifiez que PHP est correctement configuré et que le serveur web est capable d'interpréter les fichiers PHP.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4" 
              onClick={() => phpExecutionTest.refetch()}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">PHP fonctionne correctement</AlertTitle>
          <AlertDescription>
            <p className="text-green-600">
              PHP {phpExecutionTest.data?.php_version} est correctement configuré et fonctionne.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Requête traitée le {new Date(phpExecutionTest.data?.timestamp || '').toLocaleString()}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Diagnostics complets - Affichés uniquement si PHP fonctionne */}
      {phpExecutionTest.isSuccess && (
        <>
          {systemDiagnostics.isLoading ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Diagnostic système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2">Récupération des diagnostics...</span>
                </div>
              </CardContent>
            </Card>
          ) : systemDiagnostics.isError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur de diagnostic</AlertTitle>
              <AlertDescription>
                <p>Impossible de récupérer les informations de diagnostic complètes.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  onClick={() => systemDiagnostics.refetch()}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="php">
                  <Server className="mr-2 h-4 w-4" />
                  PHP & Serveur
                </TabsTrigger>
                <TabsTrigger value="assets">
                  <FileText className="mr-2 h-4 w-4" />
                  Assets
                </TabsTrigger>
                <TabsTrigger value="database">
                  <Database className="mr-2 h-4 w-4" />
                  Base de données
                </TabsTrigger>
                <TabsTrigger value="api">
                  <Globe className="mr-2 h-4 w-4" />
                  Tests API
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <FileCode className="mr-2 h-4 w-4" />
                  Tests personnalisés
                </TabsTrigger>
              </TabsList>

              <TabsContent value="php" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration PHP</CardTitle>
                    <CardDescription>
                      Informations détaillées sur la configuration PHP du serveur
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Version PHP:</span>
                        <span className="font-medium">{systemDiagnostics.data?.server_info.php.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SAPI:</span>
                        <span className="font-medium">{systemDiagnostics.data?.server_info.php.sapi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OS:</span>
                        <span className="font-medium">{systemDiagnostics.data?.server_info.php.os}</span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-2">Extensions critiques</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center">
                          {systemDiagnostics.data?.server_info.php.has_pdo ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span>PDO</span>
                        </div>
                        <div className="flex items-center">
                          {systemDiagnostics.data?.server_info.php.has_mysql ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span>MySQL</span>
                        </div>
                        <div className="flex items-center">
                          {systemDiagnostics.data?.server_info.php.has_json ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span>JSON</span>
                        </div>
                        <div className="flex items-center">
                          {systemDiagnostics.data?.server_info.php.has_mbstring ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span>mbstring</span>
                        </div>
                        <div className="flex items-center">
                          {systemDiagnostics.data?.server_info.php.has_curl ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span>cURL</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-2">Configuration réseau</h3>
                      <div className="space-y-1 text-sm">
                        {Object.entries(systemDiagnostics.data?.server_info.network || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Système de fichiers</CardTitle>
                    <CardDescription>
                      Vérification des fichiers et répertoires critiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(systemDiagnostics.data?.filesystem || {}).map(([name, info]) => (
                        <div key={name} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <span className="font-medium">{name}</span>
                            <div className="text-xs text-gray-500">
                              {info.file_count !== undefined && `${info.file_count} fichiers`}
                              {info.size !== undefined && `${Math.round(info.size / 1024)} KB`}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {info.exists ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <Check className="h-3 w-3 mr-1" /> OK
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                <X className="h-3 w-3 mr-1" /> Manquant
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets">
                <Card>
                  <CardHeader>
                    <CardTitle>Assets statiques</CardTitle>
                    <CardDescription>
                      Vérification des ressources JavaScript, CSS et médias
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!systemDiagnostics.data?.assets.assets_dir_exists ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Dossier assets introuvable</AlertTitle>
                        <AlertDescription>
                          Le répertoire des assets n'a pas été trouvé sur le serveur.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Fichiers JavaScript:</span>
                            <Badge>{systemDiagnostics.data?.assets.js_count}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Fichiers CSS:</span>
                            <Badge>{systemDiagnostics.data?.assets.css_count}</Badge>
                          </div>
                        </div>

                        {/* Liste des fichiers JS */}
                        {systemDiagnostics.data?.assets.js_files && systemDiagnostics.data.assets.js_files.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Fichiers JavaScript</h3>
                            <div className="bg-gray-50 p-2 rounded-md max-h-40 overflow-y-auto">
                              {systemDiagnostics.data.assets.js_files.map(file => (
                                <div key={file} className="text-xs font-mono py-1 border-b flex justify-between">
                                  <span>{file}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => testAssetLoading(`/assets/${file}`)}
                                  >
                                    Tester
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Liste des fichiers CSS */}
                        {systemDiagnostics.data?.assets.css_files && systemDiagnostics.data.assets.css_files.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Fichiers CSS</h3>
                            <div className="bg-gray-50 p-2 rounded-md max-h-40 overflow-y-auto">
                              {systemDiagnostics.data.assets.css_files.map(file => (
                                <div key={file} className="text-xs font-mono py-1 border-b flex justify-between">
                                  <span>{file}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => testAssetLoading(`/assets/${file}`)}
                                  >
                                    Tester
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Tester un asset spécifique</h3>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testAssetLoading('/lovable-uploads/formacert-logo.png')}
                          disabled={isRunningCustomTest}
                        >
                          Tester le logo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testAssetLoading('/assets/index.css')}
                          disabled={isRunningCustomTest}
                        >
                          Tester le CSS principal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testAssetLoading('/assets/index.js')}
                          disabled={isRunningCustomTest}
                        >
                          Tester le JS principal
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="database">
                <Card>
                  <CardHeader>
                    <CardTitle>Connexion à la base de données</CardTitle>
                    <CardDescription>
                      Test de connexion et informations sur la base de données
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemDiagnostics.data?.database.status === 'error' ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur de connexion à la base de données</AlertTitle>
                        <AlertDescription>
                          {systemDiagnostics.data.database.message}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Alert className="border-green-200 bg-green-50">
                          <Check className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-700">Connexion à la base de données réussie</AlertTitle>
                          <AlertDescription className="text-green-600">
                            La connexion à la base de données est établie.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Hôte:</span>
                            <span className="font-medium">{systemDiagnostics.data?.database.host}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base de données:</span>
                            <span className="font-medium">{systemDiagnostics.data?.database.database}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tables:</span>
                            <span className="font-medium">{systemDiagnostics.data?.database.tables?.length || 0}</span>
                          </div>
                        </div>

                        {systemDiagnostics.data?.database.tables && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Tables disponibles</h3>
                            <div className="bg-gray-50 p-2 rounded-md max-h-60 overflow-y-auto">
                              {systemDiagnostics.data.database.tables.map(table => (
                                <div key={table} className="text-xs font-mono py-1 border-b">
                                  {table}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="mt-4">
                      <Button 
                        onClick={() => testApiEndpoint('db-connection-test.php')} 
                        disabled={isRunningCustomTest}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Test de connexion directe
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>Tests d'API</CardTitle>
                    <CardDescription>
                      Vérification des points d'entrée de l'API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => testApiEndpoint('test.php')}
                        disabled={isRunningCustomTest}
                      >
                        Tester l'endpoint de test
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testApiEndpoint('index.php')}
                        disabled={isRunningCustomTest}
                      >
                        Tester l'API racine
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testApiEndpoint('info.php')}
                        disabled={isRunningCustomTest}
                      >
                        Tester phpinfo
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testApiEndpoint('diagnostic.php')}
                        disabled={isRunningCustomTest}
                      >
                        Tester le diagnostic API
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom">
                <Card>
                  <CardHeader>
                    <CardTitle>Tests personnalisés</CardTitle>
                    <CardDescription>
                      Exécuter des tests spécifiques pour le débogage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => testApiEndpoint('diagnose.php')}
                        disabled={isRunningCustomTest}
                      >
                        Test complet API
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testAssetLoading('/index.html')}
                        disabled={isRunningCustomTest}
                      >
                        Vérifier index.html
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testApiEndpoint('direct-db-test.php')}
                        disabled={isRunningCustomTest}
                      >
                        Test direct BDD
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testAssetLoading('/.htaccess')}
                        disabled={isRunningCustomTest}
                      >
                        Vérifier .htaccess
                      </Button>
                    </div>

                    {customTestResults && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Résultats du test</h3>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto max-h-80 overflow-y-auto">
                          {JSON.stringify(customTestResults, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default SystemDiagnostic;
