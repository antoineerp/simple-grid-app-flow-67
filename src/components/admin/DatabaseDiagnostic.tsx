
import React, { useState } from 'react';
import { DiagnosticHeader } from './diagnostic/DiagnosticHeader';
import { DiagnosticSections } from './diagnostic/DiagnosticSections';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from 'lucide-react';
import { DiagnosticResult } from '@/types/database-diagnostic';
import { getApiUrl } from '@/config/apiConfig';

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

const DatabaseDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      console.log(`Exécution du diagnostic de BDD depuis: ${apiUrl}/db-diagnostic.php?userId=${FIXED_USER_ID}`);
      
      const response = await fetch(`${apiUrl}/db-diagnostic.php?userId=${FIXED_USER_ID}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de réponse:", errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText.substring(0, 200)}`);
      }
      
      const responseText = await response.text();
      console.log("Réponse brute (début):", responseText.substring(0, 200));
      
      if (!responseText.trim()) {
        throw new Error("Réponse vide du serveur");
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log("Diagnostic complet:", data);
        setDiagnosticResult(data);
      } catch (jsonError) {
        console.error("Erreur de parsing JSON:", jsonError, "Texte reçu:", responseText.substring(0, 200));
        throw new Error(`La réponse n'est pas un JSON valide: ${responseText.substring(0, 100)}...`);
      }
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
