
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import { ConfigSection } from './diagnostic/ConfigSection';
import { ConsistencyCheck } from './diagnostic/ConsistencyCheck';
import { ServerInfo } from './diagnostic/ServerInfo';

interface DiagnosticResult {
  timestamp: string;
  server_info: {
    php_version: string;
    server_name: string;
    script: string;
    remote_addr: string;
  };
  pdo_direct: {
    status: string;
    message: string;
    connection_info?: {
      host: string;
      database: string;
      user: string;
    };
    error?: string;
  };
  database_class: {
    status: string;
    message: string;
    config: {
      host: string;
      db_name: string;
      username: string;
      source: string;
    };
    error?: string;
  };
  config_file: {
    status: string;
    message: string;
    config?: {
      host: string;
      db_name: string;
      username: string;
    };
    error?: string;
  };
  config_consistency: {
    status: string;
    is_consistent: boolean;
    message: string;
    differences?: {
      host: string;
      database: string;
      username: string;
    };
  };
}

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
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Diagnostic de la base de données</CardTitle>
          <CardDescription>
            Analyse complète de la configuration et des connexions à la base de données
          </CardDescription>
        </div>
        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Exécuter le diagnostic
        </Button>
      </CardHeader>
      
      <CardContent>
        {loading && !diagnosticResult ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : diagnosticResult ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfigSection
                title="Connexion PDO directe"
                status={diagnosticResult.pdo_direct.status}
                message={diagnosticResult.pdo_direct.message}
                config={diagnosticResult.pdo_direct.connection_info}
                error={diagnosticResult.pdo_direct.error}
              />
              
              <ConfigSection
                title="Classe Database"
                status={diagnosticResult.database_class.status}
                message={diagnosticResult.database_class.message}
                config={diagnosticResult.database_class.config}
                error={diagnosticResult.database_class.error}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfigSection
                title="Fichier de configuration"
                status={diagnosticResult.config_file.status}
                message={diagnosticResult.config_file.message}
                config={diagnosticResult.config_file.config}
                error={diagnosticResult.config_file.error}
              />
              
              <ConsistencyCheck
                consistency={diagnosticResult.config_consistency}
              />
            </div>
            
            <ServerInfo serverInfo={diagnosticResult.server_info} />
          </div>
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
