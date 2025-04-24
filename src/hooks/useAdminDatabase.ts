
import { useState, useEffect } from 'react';
import { testDatabaseConnection } from '@/services';
import { useToast } from "@/hooks/use-toast";

export const useAdminDatabase = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const connected = await testDatabaseConnection();
      setIsConnected(connected);
      if (connected) {
        toast({
          title: "Connexion réussie",
          description: "La connexion à la base de données est établie",
        });
      } else {
        throw new Error("La connexion à la base de données a échoué");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur de connexion inconnue");
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Erreur de connexion inconnue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return {
    loading,
    error,
    isConnected,
    testConnection
  };
};
