
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getDatabaseInfo, testDatabaseConnection } from '@/services';

// Définir l'interface pour l'information de base de données
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
  const { toast } = useToast();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getDatabaseInfo();
      console.log("Informations de la base de données reçues:", info);
      setDbInfo(info);
    } catch (err) {
      console.error("Erreur lors du chargement des informations de la base de données:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de la base de données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setError(null);
      const success = await testDatabaseConnection();
      
      if (success) {
        toast({
          title: "Test de connexion réussi",
          description: "La connexion à la base de données est opérationnelle.",
        });
        // Recharger les informations après un test réussi
        loadDatabaseInfo();
      } else {
        setError("Le test de connexion a échoué");
        toast({
          title: "Échec du test",
          description: "La connexion à la base de données a échoué.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erreur lors du test de connexion:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du test de connexion.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  return {
    dbInfo,
    loading,
    testingConnection,
    error,
    loadDatabaseInfo,
    handleTestConnection
  };
};
