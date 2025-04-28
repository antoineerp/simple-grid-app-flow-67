
import { useState, useCallback } from 'react';
import { DatabaseInfo, getDatabaseInfo } from '@/services/core/databaseConnectionService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

export const useAdminDatabase = () => {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const { toast } = useToast();

  // Fonction pour charger les informations de la base de données
  const loadDatabaseInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Utiliser la fonction getDatabaseInfo depuis les services
      const info = await getDatabaseInfo();
      setDbInfo(info);
    } catch (err) {
      console.error("Erreur lors du chargement des informations de la base de données:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur lors du chargement des informations de la base de données: ${errorMessage}`);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de la base de données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fonction pour tester la connexion à la base de données
  const handleTestConnection = useCallback(async () => {
    setTestingConnection(true);
    setError(null);
    
    try {
      const API_URL = getApiUrl();
      console.log("Test de la connexion à la base de données");
      
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success') {
          toast({
            title: "Connexion réussie",
            description: "La connexion à la base de données est établie.",
          });
        } else {
          throw new Error(data.message || "Échec de la connexion à la base de données");
        }
      } else {
        throw new Error(`Réponse HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Recharger les informations après le test
      await loadDatabaseInfo();
    } catch (err) {
      console.error("Erreur lors du test de connexion:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur lors du test de connexion: ${errorMessage}`);
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  }, [toast, loadDatabaseInfo]);

  return {
    dbInfo,
    loading,
    error,
    testingConnection,
    loadDatabaseInfo,
    handleTestConnection
  };
};
