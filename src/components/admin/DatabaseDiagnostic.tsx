
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, AlertCircle, Info } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";

// Interface pour les résultats de diagnostic
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

  // Fonction pour exécuter le diagnostic
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
      
      // Afficher un toast selon le résultat
      if (data.config_consistency && data.config_consistency.is_consistent === false) {
        toast({
          title: "Avertissement",
          description: "Les configurations de base de données ne sont pas cohérentes.",
          variant: "destructive", // Remplacé "warning" par "destructive"
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

  // Exécuter le diagnostic au chargement du composant
  useEffect(() => {
    runDiagnostic();
  }, []);

  // Fonction pour afficher un badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Succès
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Info className="h-3 w-3 mr-1" />
            Avertissement
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Diagnostic de la base de données</CardTitle>
          <CardDescription>Analyse complète de la configuration et des connexions à la base de données</CardDescription>
        </div>
        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Exécuter le diagnostic
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading && !diagnosticResult ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : diagnosticResult ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Connexion PDO directe</h3>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(diagnosticResult.pdo_direct.status)}
                  <span>{diagnosticResult.pdo_direct.message}</span>
                </div>
                {diagnosticResult.pdo_direct.connection_info && (
                  <div className="text-sm space-y-1">
                    <div><strong>Hôte:</strong> {diagnosticResult.pdo_direct.connection_info.host}</div>
                    <div><strong>Base:</strong> {diagnosticResult.pdo_direct.connection_info.database}</div>
                    <div><strong>Utilisateur:</strong> {diagnosticResult.pdo_direct.connection_info.user}</div>
                  </div>
                )}
                {diagnosticResult.pdo_direct.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{diagnosticResult.pdo_direct.error}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-medium">Classe Database</h3>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(diagnosticResult.database_class.status)}
                  <span>{diagnosticResult.database_class.message}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>Hôte:</strong> {diagnosticResult.database_class.config.host}</div>
                  <div><strong>Base:</strong> {diagnosticResult.database_class.config.db_name}</div>
                  <div><strong>Utilisateur:</strong> {diagnosticResult.database_class.config.username}</div>
                  <div><strong>Source:</strong> {diagnosticResult.database_class.config.source}</div>
                </div>
                {diagnosticResult.database_class.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{diagnosticResult.database_class.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Fichier de configuration</h3>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(diagnosticResult.config_file.status)}
                  <span>{diagnosticResult.config_file.message}</span>
                </div>
                {diagnosticResult.config_file.config && (
                  <div className="text-sm space-y-1">
                    <div><strong>Hôte:</strong> {diagnosticResult.config_file.config.host}</div>
                    <div><strong>Base:</strong> {diagnosticResult.config_file.config.db_name}</div>
                    <div><strong>Utilisateur:</strong> {diagnosticResult.config_file.config.username}</div>
                  </div>
                )}
                {diagnosticResult.config_file.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{diagnosticResult.config_file.error}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-medium">Cohérence des configurations</h3>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(diagnosticResult.config_consistency.status)}
                  <span>{diagnosticResult.config_consistency.message}</span>
                </div>
                {diagnosticResult.config_consistency.differences && (
                  <Alert variant="destructive" className="mt-2"> {/* Remplacé "warning" par "destructive" */}
                    <div className="text-sm space-y-1">
                      <div><strong>Hôte:</strong> {diagnosticResult.config_consistency.differences.host}</div>
                      <div><strong>Base:</strong> {diagnosticResult.config_consistency.differences.database}</div>
                      <div><strong>Utilisateur:</strong> {diagnosticResult.config_consistency.differences.username}</div>
                    </div>
                  </Alert>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-md font-medium mb-3">Informations serveur</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><strong>Version PHP:</strong> {diagnosticResult.server_info.php_version}</div>
                <div><strong>Serveur:</strong> {diagnosticResult.server_info.server_name}</div>
                <div><strong>Script:</strong> {diagnosticResult.server_info.script}</div>
                <div><strong>Adresse IP:</strong> {diagnosticResult.server_info.remote_addr}</div>
              </div>
            </div>
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
