
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';

export default function DbAdmin() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
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
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Administration de la base de données</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mise à jour de la structure des tables</CardTitle>
          <CardDescription>
            Cette opération vérifie et met à jour la structure des tables pour l'application.
            Elle créera les tables manquantes et ajoutera les colonnes nécessaires aux tables existantes.
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
