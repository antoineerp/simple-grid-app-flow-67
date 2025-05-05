
import { useState, useEffect } from 'react';
import { getDatabaseInfo } from '@/services/core/databaseConnectionService';

export const useAdminDatabase = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
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
