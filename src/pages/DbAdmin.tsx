
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser, getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';

export default function DbAdmin() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Fonction pour vérifier l'accès aux bases de données
  const checkDatabaseAccess = async () => {
    setIsCheckingDb(true);
    setError(null);
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/check-db-access.php`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Résultat du test des bases de données:", result);
      setDbStatus(result);
      
      if (result.status === 'success') {
        toast({
          title: "Vérification réussie",
          description: "La connexion aux bases de données a été vérifiée",
        });
      } else {
        toast({
          title: "Problème de connexion",
          description: result.message || "Impossible de vérifier les bases de données",
          variant: "destructive",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      toast({
        title: "Erreur de connexion",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCheckingDb(false);
    }
  };
  
  const updateDatabase = async () => {
    setIsUpdating(true);
    setError(null);
    setUpdateResult(null);
    
    try {
      const API_URL = getApiUrl();
      const userId = encodeURIComponent(currentUser || 'p71x6d_system');
      const response = await fetch(`${API_URL}/db-update.php?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      setUpdateResult(result);
      
      if (result.success) {
        toast({
          title: "Mise à jour réussie",
          description: "Les tables de la base de données ont été mises à jour avec succès",
        });
      } else {
        toast({
          title: "Échec de la mise à jour",
          description: result.message || "Une erreur est survenue lors de la mise à jour",
          variant: "destructive",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      toast({
        title: "Erreur de connexion",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Vérifier l'accès aux bases de données lors du chargement initial
  useEffect(() => {
    checkDatabaseAccess();
  }, []);
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Administration de la base de données</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>État des connexions aux bases de données</CardTitle>
          <CardDescription>
            Vérifiez l'accès aux différentes bases de données disponibles pour l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" />
            <span>Utilisateur actuel: <strong>{currentUser || 'p71x6d_qualiflow'}</strong></span>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {dbStatus && dbStatus.databases && (
            <div className="space-y-4">
              {Object.entries(dbStatus.databases).map(([name, info]: [string, any]) => (
                <Alert key={name} className={`mb-4 ${info.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {info.status === 'success' 
                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                    : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <AlertTitle className={info.status === 'success' ? 'text-green-800' : 'text-red-800'}>
                    Base de données: {name}
                  </AlertTitle>
                  <AlertDescription className={info.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                    {info.status === 'success' ? (
                      <>
                        <p>Connecté à: {info.database}</p>
                        <p>Nombre de tables: {info.table_count}</p>
                        {info.tables && info.tables.length > 0 && (
                          <div className="mt-2">
                            <p>Tables disponibles:</p>
                            <div className="text-xs mt-1 bg-white p-2 rounded border border-green-200 max-h-32 overflow-y-auto">
                              {info.tables.join(', ')}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p>Erreur: {info.message}</p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={checkDatabaseAccess} 
            disabled={isCheckingDb}
            className="w-full sm:w-auto"
          >
            {isCheckingDb ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Vérifier l'accès aux bases de données
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mise à jour de la structure des tables</CardTitle>
          <CardDescription>
            Cette opération vérifie et met à jour la structure des tables pour l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" />
            <span>Utilisateur actuel: <strong>{currentUser || 'p71x6d_system'}</strong></span>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {updateResult && updateResult.success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Mise à jour réussie</AlertTitle>
              <AlertDescription>
                <div className="text-green-700">
                  <p>Tables créées: {updateResult.tables_created?.length || 0}</p>
                  <p>Tables mises à jour: {updateResult.tables_updated?.length || 0}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={updateDatabase} 
            disabled={isUpdating}
            className="w-full sm:w-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour en cours...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Mettre à jour la structure des tables
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
