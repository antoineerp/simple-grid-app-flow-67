
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from '@/config/apiConfig';
import { AlertCircle, CheckCircle, RefreshCw, FilePlus, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticTest {
  test: string;
  status: 'success' | 'error';
  message: string;
  details?: any;
}

interface DiagnosticCategory {
  [key: string]: DiagnosticTest | DiagnosticTest[];
}

interface DiagnosticResult {
  php: {
    version: string;
    modules: string[];
    server_api: string;
    display_errors: string;
    error_reporting: string;
  };
  files: {
    [key: string]: DiagnosticTest;
  };
  routes: {
    [key: string]: DiagnosticTest;
  };
  database: DiagnosticTest;
  db_connection: DiagnosticTest;
  php_execution: DiagnosticTest;
  php_extensions: DiagnosticTest;
  cors: DiagnosticTest;
  summary: {
    total_tests: number;
    errors: number;
    status: 'success' | 'warning' | 'error';
    message: string;
  };
}

interface AssetsDiagnosticResult {
  status: string;
  js_files?: string[];
  css_files?: string[];
  html_references?: {
    js: boolean;
    css: boolean;
  };
  message: string;
}

const SystemDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [assetsResults, setAssetsResults] = useState<AssetsDiagnosticResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [assetsLoading, setAssetsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fixLoading, setFixLoading] = useState<boolean>(false);
  const [fixResults, setFixResults] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/check-system.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
      
      if (data.summary.errors > 0) {
        toast({
          title: "Problèmes détectés",
          description: `${data.summary.errors} problème(s) détecté(s) dans le diagnostic`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Système OK",
          description: "Tous les composants essentiels sont correctement configurés",
          variant: "default",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur s'est produite";
      setError(errorMessage);
      toast({
        title: "Erreur de diagnostic",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAssets = async () => {
    setAssetsLoading(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/diagnose-assets.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setAssetsResults(data);
      
      if (data.status === 'error') {
        toast({
          title: "Problèmes avec les assets",
          description: data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Assets OK",
          description: data.message,
          variant: "default",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur s'est produite";
      toast({
        title: "Erreur de vérification des assets",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAssetsLoading(false);
    }
  };

  const fixMissingFiles = async () => {
    setFixLoading(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/create-missing-files.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setFixResults(data);
      
      if (data.summary.created > 0) {
        toast({
          title: "Fichiers créés",
          description: `${data.summary.created} fichier(s) ont été créés avec succès`,
          variant: "default",
        });
        // Relancer le diagnostic après avoir créé les fichiers
        setTimeout(() => runDiagnostic(), 1000);
      } else if (data.summary.errors > 0) {
        toast({
          title: "Problèmes détectés",
          description: `${data.summary.errors} erreur(s) lors de la création des fichiers`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Aucun changement",
          description: "Tous les fichiers nécessaires existent déjà",
          variant: "default",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur s'est produite";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFixLoading(false);
    }
  };

  const fixAssets = async () => {
    setAssetsLoading(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/fix-index-references.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        body: 'fix_index=1'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      toast({
        title: "Correction des assets",
        description: "Les références aux assets ont été mises à jour dans index.html",
        variant: "default",
      });
      
      // Relancer la vérification des assets
      setTimeout(() => checkAssets(), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur s'est produite";
      toast({
        title: "Erreur de correction",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
    checkAssets();
  }, []);

  const renderTests = (tests: {[key: string]: DiagnosticTest}) => {
    return Object.entries(tests).map(([key, test]) => (
      <div key={key} className="mb-1 border rounded p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {test.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className="text-sm font-medium">{test.test}</span>
          </div>
          <span className={`text-xs ${test.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {test.message}
          </span>
        </div>
      </div>
    ));
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runDiagnostic} 
          disabled={loading} 
          className="mt-2"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Réessayer
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Diagnostic système</h2>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostic} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fixMissingFiles} 
            disabled={fixLoading || !results || results.summary.errors === 0}
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Créer fichiers manquants
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2">Analyse en cours...</span>
        </div>
      ) : results ? (
        <div className="space-y-4">
          <Alert 
            variant={results.summary.status === 'success' ? 'default' : 'destructive'} 
            className={results.summary.status === 'success' ? 'bg-green-50' : ''}
          >
            {results.summary.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {results.summary.status === 'success' ? 'Système opérationnel' : 'Attention'}
            </AlertTitle>
            <AlertDescription>
              {results.summary.message}
            </AlertDescription>
          </Alert>

          {/* Ajout d'une nouvelle section pour les assets */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Diagnostic des assets (CSS/JS)</h3>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkAssets} 
                  disabled={assetsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${assetsLoading ? 'animate-spin' : ''}`} />
                  Vérifier les assets
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fixAssets} 
                  disabled={assetsLoading || !assetsResults || assetsResults.status === 'success'}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Corriger index.html
                </Button>
              </div>
            </div>
            
            {assetsResults ? (
              <div>
                <Alert 
                  variant={assetsResults.status === 'success' ? 'default' : 'destructive'} 
                  className={assetsResults.status === 'success' ? 'bg-green-50' : ''}
                >
                  {assetsResults.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {assetsResults.status === 'success' ? 'Assets OK' : 'Problème avec les assets'}
                  </AlertTitle>
                  <AlertDescription>
                    {assetsResults.message}
                  </AlertDescription>
                </Alert>
                
                {assetsResults.js_files && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium">Fichiers JavaScript trouvés:</h4>
                    <ul className="text-xs mt-1">
                      {assetsResults.js_files.map((file, index) => (
                        <li key={index} className="mb-1">{file}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {assetsResults.css_files && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Fichiers CSS trouvés:</h4>
                    <ul className="text-xs mt-1">
                      {assetsResults.css_files.map((file, index) => (
                        <li key={index} className="mb-1">{file}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {assetsResults.html_references && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium">Références dans index.html:</h4>
                    <div className="text-xs mt-1">
                      <p className={`${assetsResults.html_references.js ? 'text-green-600' : 'text-red-600'}`}>
                        {assetsResults.html_references.js ? '✅ Référence JS trouvée' : '❌ Référence JS manquante'}
                      </p>
                      <p className={`${assetsResults.html_references.css ? 'text-green-600' : 'text-red-600'}`}>
                        {assetsResults.html_references.css ? '✅ Référence CSS trouvée' : '❌ Référence CSS manquante'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                {assetsLoading ? (
                  <div className="flex justify-center items-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm">Vérification des assets...</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Cliquez sur "Vérifier les assets" pour analyser les fichiers CSS et JS</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Environnement PHP</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Version:</span> {results.php.version}</p>
                <p><span className="font-medium">API:</span> {results.php.server_api}</p>
                <p><span className="font-medium">Affichage erreurs:</span> {results.php.display_errors}</p>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-medium">Extensions requises:</h4>
                {results.php_extensions.status === 'success' ? (
                  <span className="text-xs text-green-600">{results.php_extensions.message}</span>
                ) : (
                  <span className="text-xs text-red-600">{results.php_extensions.message}</span>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Configuration base de données</h3>
              <div className="text-sm">
                {results.database.status === 'success' ? (
                  <div>
                    <p><span className="font-medium">Hôte:</span> {results.database.details?.host}</p>
                    <p><span className="font-medium">Base de données:</span> {results.database.details?.database}</p>
                    <p><span className="font-medium">Utilisateur:</span> {results.database.details?.user}</p>
                    <p className="mt-2 text-green-600">{results.database.message}</p>
                  </div>
                ) : (
                  <p className="text-red-600">{results.database.message}</p>
                )}
              </div>

              <div className="mt-2">
                <h4 className="text-sm font-medium">Test de connexion:</h4>
                {results.db_connection.status === 'success' ? (
                  <span className="text-xs text-green-600">{results.db_connection.message}</span>
                ) : (
                  <span className="text-xs text-red-600">{results.db_connection.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Fichiers essentiels</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {renderTests(results.files)}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Routes API</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {renderTests(results.routes)}
            </div>
          </div>

          {fixResults && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium mb-2">Résultats de la correction</h3>
              <p className="text-sm">{fixResults.summary.message}</p>
              <div className="mt-2 space-y-1">
                {Object.entries(fixResults.details).map(([key, value]: [string, any]) => (
                  <div key={key} className="text-xs flex items-center justify-between">
                    <span>{key}</span>
                    <span className={
                      value.status === 'created' ? 'text-green-600' : 
                      value.status === 'error' ? 'text-red-600' : 
                      'text-blue-600'
                    }>
                      {value.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SystemDiagnostic;
