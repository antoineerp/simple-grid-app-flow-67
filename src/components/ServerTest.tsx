
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

const ServerTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const { toast } = useToast();

  const testEndpoints = [
    { name: "Test PHP Exécution", url: "/api/check-php-execution.php" },
    { name: "Test Base de Données", url: "/api/check-db-connection.php" },
    { name: "Test JSON API", url: "/api/json-test.php" },
    { name: "Test Version PHP", url: "/api/phpinfo-test.php" },
  ];

  const runTests = async () => {
    setIsRunningTests(true);
    const newResults: TestResult[] = [];
    
    for (const endpoint of testEndpoints) {
      const startTime = performance.now();
      
      // Initialiser le résultat avec statut pending
      newResults.push({
        name: endpoint.name,
        status: 'pending',
        message: 'Test en cours...'
      });
      setResults([...newResults]);
      
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        const duration = Math.round(performance.now() - startTime);
        
        if (response.ok) {
          try {
            const data = await response.json();
            const lastIndex = newResults.length - 1;
            newResults[lastIndex] = {
              name: endpoint.name,
              status: data.success ? 'success' : 'error',
              message: data.message || 'Test réussi sans message',
              duration
            };
          } catch (jsonError) {
            const text = await response.text();
            const lastIndex = newResults.length - 1;
            newResults[lastIndex] = {
              name: endpoint.name,
              status: 'warning',
              message: `Réponse non-JSON: ${text.substring(0, 100)}...`,
              duration
            };
          }
        } else {
          const lastIndex = newResults.length - 1;
          newResults[lastIndex] = {
            name: endpoint.name,
            status: 'error',
            message: `Erreur HTTP ${response.status}: ${response.statusText}`,
            duration
          };
        }
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        const lastIndex = newResults.length - 1;
        newResults[lastIndex] = {
          name: endpoint.name,
          status: 'error',
          message: `Erreur de connexion: ${error instanceof Error ? error.message : String(error)}`,
          duration
        };
      }
      
      setResults([...newResults]);
    }
    
    setIsRunningTests(false);
    
    toast({
      title: "Tests serveur terminés",
      description: `${newResults.filter(r => r.status === 'success').length} sur ${newResults.length} tests réussis`,
      variant: newResults.every(r => r.status === 'success') ? "default" : "destructive"
    });
  };

  useEffect(() => {
    // Exécute les tests automatiquement au chargement du composant
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tests de Connexion au Serveur</h2>
        <Button 
          onClick={runTests}
          disabled={isRunningTests}
        >
          {isRunningTests ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test en cours
            </>
          ) : 'Relancer les tests'}
        </Button>
      </div>
      
      {results.length === 0 && isRunningTests && (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Exécution des tests en cours...</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <Card key={index} className={`${
            result.status === 'success' ? 'border-green-200 bg-green-50' : 
            result.status === 'error' ? 'border-red-200 bg-red-50' : 
            result.status === 'warning' ? 'border-amber-200 bg-amber-50' : 
            'border-blue-200 bg-blue-50'
          }`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium flex items-center">
                  {getStatusIcon(result.status)}
                  <span className="ml-2">{result.name}</span>
                </CardTitle>
                {result.duration && (
                  <span className="text-xs text-gray-500">
                    {result.duration}ms
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm whitespace-pre-wrap break-words">
                {result.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {results.some(r => r.status === 'error') && (
        <Alert variant="destructive">
          <AlertTitle>Problèmes détectés</AlertTitle>
          <AlertDescription>
            Certains tests ont échoué. Vérifiez la configuration de votre serveur et de votre base de données.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ServerTest;
