
// This file has type errors with the "warning" variant that's not supported
// Change those to "destructive" which is a valid variant
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminDatabase } from '@/hooks/useAdminUsers';
import { getApiUrl } from '@/config/apiConfig';
import { getDatabaseConnectionCurrentUser } from '@/services';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const DatabaseInfo = () => {
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { loading: adminLoading } = useAdminDatabase();
  const currentUser = getDatabaseConnectionCurrentUser();

  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = getApiUrl();
        console.log("Fetching database info from:", apiUrl);
        const response = await fetch(`${apiUrl}/database-test.php`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log("Database info response (raw):", text);
        
        try {
          const data = JSON.parse(text);
          console.log("Database info parsed:", data);
          setDatabaseInfo(data);
        } catch (parseError) {
          console.error("Parse error:", parseError);
          setError(`Erreur de format de réponse: ${text.substring(0, 100)}...`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Erreur de connexion: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseInfo();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? "bg-green-500" : "bg-red-500";
  };

  const getConnectionStatus = () => {
    if (databaseInfo?.database?.connected) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Connectée</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Déconnectée</span>
        </div>
      );
    }
  };

  // Check for inconsistency where we have a current user but the DB shows as disconnected
  const hasStatusInconsistency = currentUser && databaseInfo?.database?.connected === false;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Information sur la base de données</CardTitle>
            <CardDescription>État de la connexion et informations de la base de données</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {hasStatusInconsistency && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Incohérence détectée: Vous êtes connecté en tant que {currentUser} mais l'état de la base de données indique déconnecté.
              Essayez de rafraîchir la page ou de vous reconnecter.
            </AlertDescription>
          </Alert>
        )}

        {loading || adminLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Chargement des informations...</span>
          </div>
        ) : databaseInfo ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">État de la connexion</h3>
                {getConnectionStatus()}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Version MySQL</h3>
                <p>{databaseInfo.database?.version || "Non disponible"}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Dernière erreur</h3>
              <p>{databaseInfo.database?.last_error || "Aucune erreur récente"}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Utilisateur connecté</h3>
              <p>{currentUser || "Aucun utilisateur connecté"}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Configuration</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Hôte: {databaseInfo.config?.host || "Non configuré"}</li>
                <li>Base de données: {databaseInfo.config?.db_name || "Non configuré"}</li>
                <li>Utilisateur: {databaseInfo.config?.username || "Non configuré"}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Aucune information disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseInfo;
