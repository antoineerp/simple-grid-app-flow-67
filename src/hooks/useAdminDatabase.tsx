
import { useState, useEffect } from 'react';
import { getDatabaseInfo, testDatabaseConnection, type DatabaseInfo } from '@/services';
import { useToast } from "@/hooks/use-toast";

export const useAdminDatabase = () => {
  const { toast } = useToast();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      const info = await getDatabaseInfo();
      setDbInfo(info);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erreur lors du chargement des informations de la base de données", error);
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
    setTestingConnection(true);
    try {
      const result = await testDatabaseConnection();
      if (result) {
        // Recharger les informations de la base de données après un test réussi
        await loadDatabaseInfo();
      }
    } finally {
      setTestingConnection(false);
    }
  };

  // Charger les informations de la base de données au montage du composant
  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  return {
    dbInfo,
    loading,
    testingConnection,
    lastUpdate,
    loadDatabaseInfo,
    handleTestConnection
  };
};
