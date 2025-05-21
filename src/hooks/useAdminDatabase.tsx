
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

export interface DbInfo {
  host: string;
  database: string;
  username: string;
  size: string;
  tables: number;
  encoding?: string;
  collation?: string;
  tableList?: string[];
  lastBackup: string;
  lastSync?: Date | null;
}

export const useAdminDatabase = () => {
  const { toast } = useToast();
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Vérifier si les données sont synchronisées entre appareils
  useEffect(() => {
    // Enregistrer un gestionnaire d'événements pour recevoir les mises à jour
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('dbSync_timestamp')) {
        console.log("Détection d'une synchronisation de base de données depuis un autre appareil");
        loadDatabaseInfo(); // Recharger les informations
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Nettoyer lors du démontage
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadDatabaseInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = getApiUrl();
      console.log(`Chargement des informations de la base de données depuis: ${apiUrl}/test.php?action=dbinfo`);
      
      // Utiliser directement l'endpoint qui fonctionne
      const response = await fetch(`${apiUrl}/test.php?action=tables&userId=${FIXED_USER_ID}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      console.log("Informations de la base de données reçues:", data);
      
      // Formatter les informations pour notre interface
      if (data && data.tables) {
        const tableList = data.tables;
        
        const newInfo = {
          host: "p71x6d.myd.infomaniak.com",
          database: FIXED_USER_ID,
          username: FIXED_USER_ID,
          size: "Variable",
          tables: tableList.length,
          tableList: tableList,
          lastBackup: new Date().toLocaleDateString(),
          encoding: "UTF-8",
          collation: "utf8mb4_unicode_ci",
          lastSync: new Date()
        };
        
        setDbInfo(newInfo);
        setLastSync(new Date());
        
        // Enregistrer le timestamp de synchronisation pour les autres appareils
        localStorage.setItem('dbSync_timestamp', new Date().toISOString());
        // Déclencher un événement personnalisé pour informer les autres composants
        window.dispatchEvent(new CustomEvent('database-synced', { 
          detail: { timestamp: new Date().toISOString() } 
        }));
      } else {
        throw new Error("Format de données invalide ou aucune table trouvée");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des infos DB:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des informations de la base de données");
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de la base de données.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleTestConnection = useCallback(async () => {
    setTestingConnection(true);
    try {
      const apiUrl = getApiUrl();
      console.log(`Test de connexion à la base de données depuis: ${apiUrl}/test.php`);
      
      // Utiliser directement l'endpoint qui fonctionne
      const response = await fetch(`${apiUrl}/test.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      console.log("Résultat du test de connexion:", data);
      
      if (data.status === 'success') {
        toast({
          title: "Connexion réussie",
          description: `Connecté à la base de données ${FIXED_USER_ID}`,
        });
        
        // Recharger les informations après un test réussi
        loadDatabaseInfo();
        
        // Enregistrer le timestamp de test réussi pour les autres appareils
        localStorage.setItem('dbTest_timestamp', new Date().toISOString());
        
        // Déclencher un événement personnalisé pour informer les autres composants
        window.dispatchEvent(new CustomEvent('database-test-succeeded', { 
          detail: { timestamp: new Date().toISOString() } 
        }));
      } else {
        throw new Error(data.message || "Test de connexion échoué");
      }
    } catch (err) {
      console.error("Erreur lors du test de connexion:", err);
      
      toast({
        title: "Échec du test",
        description: err instanceof Error ? err.message : "Erreur lors du test de connexion",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  }, [toast, loadDatabaseInfo]);

  return {
    dbInfo,
    loading,
    testingConnection,
    error,
    loadDatabaseInfo,
    handleTestConnection,
    lastSync
  };
};
