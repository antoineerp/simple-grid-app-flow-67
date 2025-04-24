
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Database, Server, RefreshCw } from "lucide-react";
import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';

interface DiagnosticResult {
  status: number;
  message: string;
  timestamp: string;
  server_info?: {
    php_version: string;
    server_software: string;
    document_root: string;
  };
  database?: {
    connected: boolean;
    version?: string;
    error?: string;
  };
  api_endpoints?: {
    [key: string]: {
      url: string;
      http_code: number;
      response_size: number;
    };
  };
}

const ApiDiagnostic = () => {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const API_URL = getApiUrl();
      console.log("Running diagnostic at:", `${API_URL}/diagnose.php`);
      
      const response = await fetchWithErrorHandling(`${API_URL}/diagnose.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      setDiagnosticResult(response);
    } catch (err) {
      console.error("Diagnostic error:", err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Diagnostic API</CardTitle>
        <CardDescription>
          Vérification complète de l'API et des services associés
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">État du système</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostic}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Diagnostic en cours...' : 'Relancer le diagnostic'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {diagnosticResult && (
          <div className="space-y-4">
            {/* Informations serveur */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Server className="h-4 w-4 mr-2" />
                Serveur
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Version PHP:</div>
                <div>{diagnosticResult.server_info?.php_version}</div>
                <div>Logiciel:</div>
                <div>{diagnosticResult.server_info?.server_software}</div>
              </div>
            </div>

            {/* État base de données */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Base de données
              </h4>
              {diagnosticResult.database && (
                <Alert variant={diagnosticResult.database.connected ? "default" : "destructive"}>
                  <div className="flex items-center">
                    {diagnosticResult.database.connected ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    <div>
                      <AlertTitle>
                        {diagnosticResult.database.connected ? "Connecté" : "Non connecté"}
                      </AlertTitle>
                      <AlertDescription>
                        {diagnosticResult.database.connected
                          ? `Version: ${diagnosticResult.database.version}`
                          : `Erreur: ${diagnosticResult.database.error}`}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>

            {/* Tests des endpoints */}
            {diagnosticResult.api_endpoints && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Endpoints API</h4>
                <div className="space-y-2">
                  {Object.entries(diagnosticResult.api_endpoints).map(([name, info]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span>{name}</span>
                      <Badge variant={info.http_code === 200 ? "default" : "destructive"}>
                        {info.http_code}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Dernier diagnostic: {diagnosticResult?.timestamp || 'Jamais'}
      </CardFooter>
    </Card>
  );
};

export default ApiDiagnostic;
