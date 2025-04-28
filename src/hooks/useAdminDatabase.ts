
import { useState, useCallback, useEffect } from 'react';
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
      // Utiliser l'endpoint direct pour obtenir des informations réelles
      const response = await fetch('/api/direct-db-test.php');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || result.error || 'Échec de la récupération des informations');
      }
      
      // Format des données pour notre interface
      const info: DatabaseInfo = {
        host: result.host,
        database: result.database,
        size: result.size || '0 MB',
        tables: result.tables ? result.tables.length : 0,
        lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00',
        status: 'Online',
        encoding: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        tableList: result.tables || []
      };
      
      setDbInfo(info);
      console.log("Informations de la base de données reçues:", info);
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
      
      // Utiliser l'endpoint direct pour un test réel
      const response = await fetch(`${API_URL}/direct-db-test.php`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Échec du test (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Connexion réussie",
          description: `Connexion établie à ${data.host || 'la base de données'}.`,
        });
      } else {
        throw new Error(data.message || data.error || "Échec de la connexion à la base de données");
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

  // Charger les informations au montage du composant
  useEffect(() => {
    loadDatabaseInfo();
  }, [loadDatabaseInfo]);

  return {
    dbInfo,
    loading,
    error,
    testingConnection,
    loadDatabaseInfo,
    handleTestConnection
  };
};
