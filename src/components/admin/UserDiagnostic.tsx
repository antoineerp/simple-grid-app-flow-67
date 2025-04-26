
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';

const UserDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/user-diagnostic.php`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${await response.text()}`);
      }
      
      const data = await response.json();
      console.log("User diagnostic response:", data);
      setDiagnosticResult(data);
    } catch (err) {
      console.error("Erreur pendant le diagnostic utilisateur:", err);
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">Diagnostic des utilisateurs</h3>
            <p className="text-sm text-muted-foreground">
              Vérifiez la configuration des utilisateurs et des permissions
            </p>
          </div>
          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            variant="secondary"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Analyse en cours...' : 'Exécuter le diagnostic'}
          </Button>
        </div>
        
        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {diagnosticResult && !loading && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Diagnostic exécuté le {diagnosticResult.timestamp}
            </p>
            
            {diagnosticResult.directory_structure && (
              <div className="rounded-md bg-gray-50 p-4">
                <h4 className="font-medium mb-2">Structure des répertoires</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(diagnosticResult.directory_structure).map(([dir, info]: [string, any]) => (
                    <div key={dir} className="text-sm">
                      <span className="font-medium">{dir}:</span>{' '}
                      {info.exists ? (
                        <span className="text-green-600">Existe</span>
                      ) : (
                        <span className="text-red-600">Manquant</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {diagnosticResult.api_check && (
              <div className={`rounded-md p-4 ${diagnosticResult.api_check.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <h4 className="font-medium mb-2">Vérification de l'API</h4>
                <p className="text-sm">
                  {diagnosticResult.api_check.message}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDiagnostic;
