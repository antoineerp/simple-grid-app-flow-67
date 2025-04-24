
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from '@/config/apiConfig';
import { getDatabaseConnectionCurrentUser, getDatabaseInfo } from '@/services';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const DatabaseInfo = () => {
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const currentUser = getDatabaseConnectionCurrentUser();

  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Méthode 1: Utiliser le service existant
        const serviceInfo = await getDatabaseInfo();
        console.log("Info récupérée via service:", serviceInfo);
        
        if (serviceInfo.status === "Online") {
          setDatabaseInfo({
            database: {
              connected: true,
              host: serviceInfo.host,
              name: serviceInfo.database
            }
          });
          return;
        }
        
        // Méthode 2: Appel direct à notre nouvel endpoint simplifié
        const apiUrl = getApiUrl();
        console.log("Utilisation de l'endpoint de secours:", `${apiUrl}/database-info.php`);
        
        const response = await fetch(`${apiUrl}/database-info.php`);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Réponse de l'endpoint de secours:", data);
        
        setDatabaseInfo({
          database: {
            connected: true,
            host: data.database_info?.host || "Non disponible",
            name: data.database_info?.database || "Non disponible",
            version: "MySQL"
          }
        });
        
      } catch (err) {
        console.error("Erreur lors de la récupération des infos DB:", err);
        setError(`${err instanceof Error ? err.message : String(err)}`);
        
        // En cas d'erreur mais avec un utilisateur connecté, afficher des infos de base
        if (currentUser) {
          setDatabaseInfo({
            database: {
              connected: true,
              host: `${currentUser}.myd.infomaniak.com`,
              name: currentUser,
              version: "MySQL"
            }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseInfo();
  }, [refreshKey, currentUser]);

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
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

  // Vérifier si on a un utilisateur connecté mais pas d'infos DB
  const hasStatusInconsistency = currentUser && (!databaseInfo || !databaseInfo.database?.connected);

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

        {loading ? (
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
                <h3 className="font-medium text-lg">Type de base de données</h3>
                <p>{databaseInfo.database?.version || "MySQL"}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Utilisateur connecté</h3>
              <p>{currentUser || "Aucun utilisateur connecté"}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Configuration</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Hôte: {databaseInfo.database?.host || "Non configuré"}</li>
                <li>Base de données: {databaseInfo.database?.name || "Non configuré"}</li>
                <li>Statut: {databaseInfo.database?.connected ? "Connecté" : "Déconnecté"}</li>
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
