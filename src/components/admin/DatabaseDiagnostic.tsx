
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import { DiagnosticHeader } from './diagnostic/DiagnosticHeader';
import { DiagnosticSections } from './diagnostic/DiagnosticSections';
import { DiagnosticResult } from '@/types/database-diagnostic';

const DatabaseDiagnostic: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = getApiUrl();
      console.log("Exécution du diagnostic de base de données depuis:", API_URL);
      
      const response = await fetch(`${API_URL}/database-diagnostic`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Échec du diagnostic (${response.status}): ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      console.log("Résultat du diagnostic:", data);
      
      setDiagnosticResult(data);
      
      if (data.config_consistency && data.config_consistency.is_consistent === false) {
        toast({
          title: "Avertissement",
          description: "Les configurations de base de données ne sont pas cohérentes.",
          variant: "destructive",
        });
      } else if (data.pdo_direct.status === 'success' && data.database_class.status === 'success') {
        toast({
          title: "Diagnostic réussi",
          description: "Toutes les connexions à la base de données sont opérationnelles.",
        });
      }
    } catch (err) {
      console.error("Erreur lors du diagnostic:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Échec du diagnostic de base de données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <Card>
      <CardHeader>
        <DiagnosticHeader loading={loading} onRun={runDiagnostic} />
      </CardHeader>
      
      <CardContent>
        {loading && !diagnosticResult ? (
          <div className="flex justify-center items-center h-40">
            <p>Chargement du diagnostic...</p>
          </div>
        ) : diagnosticResult ? (
          <DiagnosticSections diagnosticResult={diagnosticResult} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucun résultat de diagnostic disponible
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between bg-muted/10">
        <p className="text-xs text-muted-foreground">
          Ce diagnostic vérifie toutes les méthodes de connexion à la base de données
        </p>
        {diagnosticResult && (
          <p className="text-xs text-muted-foreground">
            Diagnostic exécuté le: {diagnosticResult.timestamp}
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default DatabaseDiagnostic;
