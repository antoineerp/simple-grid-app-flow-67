
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDatabaseInfo } from '@/services/core/databaseConnectionService';
import { databaseHelper } from '@/services/sync/DatabaseHelper';

// Interface pour les informations de la base de données
interface DatabaseInfo {
  host: string;
  db_name: string;
  username: string;
  password?: string;
  is_connected: boolean;
  error?: string | null;
  source?: string;
}

export function useAdminDatabase() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Charger les informations de la base de données
  const loadDatabaseInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getDatabaseInfo();
      
      if (data.error) {
        setError(data.error);
        toast({
          title: "Erreur de connexion",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setDatabaseInfo(data);
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
      setIsLoading(false);
    }
  }, [toast]);
  
  // Mettre à jour la structure de la base de données
  const updateDatabaseStructure = useCallback(async () => {
    setIsUpdating(true);
    
    try {
      const result = await databaseHelper.forceUpdateAllTables();
      
      if (result.success) {
        toast({
          title: "Mise à jour réussie",
          description: "La structure de la base de données a été mise à jour avec succès",
        });
      } else {
        toast({
          title: "Échec de la mise à jour",
          description: result.message || "Une erreur est survenue lors de la mise à jour",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast({
        title: "Erreur de mise à jour",
        description: message,
        variant: "destructive",
      });
      return { success: false, message };
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);
  
  // Charger les informations au montage
  useEffect(() => {
    loadDatabaseInfo();
  }, [loadDatabaseInfo]);
  
  return {
    databaseInfo,
    isLoading,
    error,
    isUpdating,
    loadDatabaseInfo,
    updateDatabaseStructure
  };
}
