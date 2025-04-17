
import { useState } from 'react';
import { getDatabaseInfo, testDatabaseConnection, type DatabaseInfo } from '@/services';
import { useToast } from "@/hooks/use-toast";

export const useAdminDatabase = () => {
  const { toast } = useToast();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      const info = await getDatabaseInfo();
      setDbInfo(info);
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
      await testDatabaseConnection();
    } finally {
      setTestingConnection(false);
    }
  };

  return {
    dbInfo,
    loading,
    testingConnection,
    loadDatabaseInfo,
    handleTestConnection
  };
};
