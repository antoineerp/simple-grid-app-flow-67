
import React, { useState } from 'react';
import { DiagnosticHeader } from './diagnostic/DiagnosticHeader';
import { DiagnosticSections } from './diagnostic/DiagnosticSections';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from 'lucide-react';
import { DiagnosticResult } from '@/types/database-diagnostic';
import { getApiUrl } from '@/config/apiConfig';

const DatabaseDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/db-diagnostic.php`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${await response.text()}`);
      }
      
      const data = await response.json();
      console.log("Diagnostic response:", data);
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
      <CardContent className="p-6">
        <DiagnosticHeader 
          loading={loading} 
          error={error} 
          onRun={runDiagnostic}
        />
        
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error && !loading && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {diagnosticResult && !loading && (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
              Diagnostic exécuté le {diagnosticResult.timestamp}
            </p>
            
            <DiagnosticSections diagnosticResult={diagnosticResult} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDiagnostic;
