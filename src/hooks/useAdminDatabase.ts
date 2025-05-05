
import { useState, useEffect } from 'react';
import { getDatabaseInfo } from '@/services/core/databaseConnectionService';

interface DatabaseInfo {
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      try {
        setIsLoading(true);
        const info = await getDatabaseInfo();
        setDatabaseInfo(info);
        setError(null);
      } catch (e) {
        console.error("Erreur lors de la récupération des informations de la base de données:", e);
        setError(e instanceof Error ? e.message : "Erreur inconnue");
        setDatabaseInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabaseInfo();
  }, []);

  return {
    isLoading,
    databaseInfo,
    error
  };
};
