
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from '@/config/apiConfig';
import { AlertCircle, CheckCircle, RefreshCw, FilePlus } from 'lucide-react';
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

const SystemDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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

  useEffect(() => {
    runDiagnostic();
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
