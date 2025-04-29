
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, FolderTree, FileText, Folder } from "lucide-react";
import { getApiUrl } from '@/config/apiConfig';

const UserDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Exécution du diagnostic utilisateur...");
      const response = await fetch(`${getApiUrl()}/user-diagnostic.php`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText.substring(0, 200)}`);
      }
      
      const data = await response.json();
      console.log("Résultat du diagnostic utilisateur:", data);
      setDiagnosticResult(data);
    } catch (err) {
      console.error("Erreur pendant le diagnostic:", err);
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Diagnostic utilisateur</CardTitle>
          <Button onClick={runDiagnostic} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Exécuter
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {diagnosticResult && !loading && (
          <div className="space-y-4">
            <Alert variant="default">
              <CheckCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{diagnosticResult.message}</AlertDescription>
            </Alert>
            
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <FolderTree className="h-5 w-5 mr-2" />
                Structure des répertoires
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosticResult.directory_structure && Object.entries(diagnosticResult.directory_structure).map(([key, value]: [string, any]) => (
                  <div key={key} className="border rounded-md p-3">
                    <div className="flex items-center mb-1">
                      <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{key}</span>
                      {value.exists ? (
                        <span className="ml-auto text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">Existe</span>
                      ) : (
                        <span className="ml-auto text-xs bg-red-100 text-red-800 py-0.5 px-2 rounded-full">Manquant</span>
                      )}
                    </div>
                    
                    {value.exists && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Lecture:</span>
                          <span>{value.readable ? 'Oui' : 'Non'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Écriture:</span>
                          <span>{value.writable ? 'Oui' : 'Non'}</span>
                        </div>
                        
                        {value.files && (
                          <div className="mt-1">
                            <div className="text-xs font-medium">Fichiers:</div>
                            <div className="bg-muted p-2 rounded-sm max-h-24 overflow-y-auto">
                              {value.files.filter((file: string) => file !== '.' && file !== '..').map((file: string) => (
                                <div key={file} className="flex items-center text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {file}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">État de l'API</h3>
              {diagnosticResult.api_check && (
                <Alert variant={diagnosticResult.api_check.status === 'success' ? 'default' : 'destructive'}>
                  {diagnosticResult.api_check.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  )}
                  <AlertDescription>{diagnosticResult.api_check.message}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="pt-2 text-xs text-muted-foreground">
              Diagnostic exécuté le {diagnosticResult.timestamp}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDiagnostic;
