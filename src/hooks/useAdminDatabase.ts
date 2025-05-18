
import { useState, useCallback, useEffect } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

// Interface pour les informations de base de données
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
  encoding?: string;
  collation?: string;
  tableList?: string[];
}

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
      const API_URL = getApiUrl();
      // Utiliser uniquement l'endpoint unifié et fiable
      const response = await fetch(`${API_URL}/test-db-connection.php`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Informations de la base de données:", result);
      
      // Vérifier si la connexion à la base de données est réussie
      if (result.status !== 'success') {
        throw new Error(result.message || "Échec de connexion à la base de données");
      }
      
      // Formater les données pour notre interface
      const info: DatabaseInfo = {
        host: result.database?.host || '',
        database: result.database?.name || '',
        size: '0 MB', // Valeur par défaut
        tables: result.tables?.utilisateurs_count || 0,
        lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00', // Date du jour
        status: result.status === 'success' ? 'Online' : 'Offline',
        encoding: 'utf8mb4', // Valeur par défaut
        collation: 'utf8mb4_unicode_ci', // Valeur par défaut
        tableList: []
      };
      
      setDbInfo(info);
    } catch (err) {
      console.error("Erreur lors du chargement des informations de la base de données:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      
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
      // Utiliser uniquement l'endpoint unifié et fiable
      const response = await fetch(`${API_URL}/test-db-connection.php`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Résultat du test de connexion:", result);
      
      if (result.status !== 'success') {
        throw new Error(result.message || "Échec de connexion à la base de données");
      }
      
      toast({
        title: "Connexion réussie",
        description: `Connexion établie à ${result.database?.host || 'la base de données'}.`,
      });
      
      // Recharger les informations après le test
      await loadDatabaseInfo();
    } catch (err) {
      console.error("Erreur lors du test de connexion:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      
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
