
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { fullApiDiagnostic, diagnoseApiConnection } from '@/services/sync';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Diagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [apiTests, setApiTests] = useState<any>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  
  const runDiagnostic = async () => {
    setLoading(true);
    try {
      // Test de connexion API
      const connection = await diagnoseApiConnection();
      setConnectionInfo(connection);
      
      // Tests complets API
      const tests = await fullApiDiagnostic();
      setApiTests(tests);
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    runDiagnostic();
  }, []);
  
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Diagnostic Système</h1>
          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Diagnostic en cours...' : 'Actualiser'}
          </Button>
        </div>
        
        {/* Informations de connexion API */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connexion API</CardTitle>
            <CardDescription>
              Configuration API actuelle: <code>{getApiUrl()}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!connectionInfo && loading && (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            )}
            
            {connectionInfo && (
              <Alert variant={connectionInfo.success ? "default" : "destructive"}>
                {connectionInfo.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {connectionInfo.success 
                    ? "API connectée" 
                    : "Problème de connexion API"}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <p>URL testée: <code>{connectionInfo.diagnostics.apiEndpoint}</code></p>
                    <p>Statut HTTP: {connectionInfo.diagnostics.status || 'Non disponible'}</p>
                    <p>Type de contenu: {connectionInfo.diagnostics.responseType || 'Non disponible'}</p>
                    <p>Exécution PHP: {
                      connectionInfo.diagnostics.isPhpExecuted === true ? 'OK' :
                      connectionInfo.diagnostics.isPhpExecuted === false ? 'Erreur' : 
                      'Non testé'
                    }</p>
                    {connectionInfo.diagnostics.error && (
                      <p className="text-red-500">Erreur: {connectionInfo.diagnostics.error}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {/* Résultats des tests API */}
        <Card>
          <CardHeader>
            <CardTitle>Tests des points d'accès API</CardTitle>
            <CardDescription>
              Résultats des tests sur les principaux points d'accès de l'API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!apiTests && loading && (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            )}
            
            {apiTests && (
              <div>
                <Alert 
                  variant={
                    apiTests.status === 'success' ? "default" : 
                    apiTests.status === 'partial' ? "warning" : 
                    "destructive"
                  }
                  className="mb-4"
                >
                  {apiTests.status === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : apiTests.status === 'partial' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {apiTests.status === 'success' ? "Tous les tests ont réussi" : 
                     apiTests.status === 'partial' ? "Certains tests ont échoué" :
                     "Tous les tests ont échoué"}
                  </AlertTitle>
                </Alert>
                
                <div className="space-y-4">
                  {apiTests.tests.map((test: any, index: number) => (
                    <div key={index} className={`p-3 rounded-md border ${
                      test.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center">
                        {test.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <div className="mt-1 text-xs">
                        <p className="text-gray-600">URL: <code>{test.url}</code></p>
                        <p className={test.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {test.detail}
                        </p>
                      </div>
                      <a 
                        href={test.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs flex items-center text-blue-600 hover:underline mt-2"
                      >
                        Ouvrir dans une nouvelle fenêtre
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-xs text-gray-500">
              Pour plus d'informations, consultez également la page de test de routes.
            </div>
            <a 
              href="/test-routes.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              Test Routes
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-600 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;
