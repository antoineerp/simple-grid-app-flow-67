
import { useState, useEffect } from 'react';
import { getDatabaseInfo, testDatabaseConnection, type DatabaseInfo } from '@/services';
import { useToast } from "@/hooks/use-toast";

export const useAdminDatabase = () => {
  const { toast } = useToast();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getDatabaseInfo();
      setDbInfo(info);
      setLastUpdate(new Date());
      
      if (info.status !== "Online") {
        setError("La base de données n'est pas accessible. Vérifiez la configuration.");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des informations de la base de données", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les informations de la base de données");
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
    setError(null);
    try {
      const result = await testDatabaseConnection();
      if (result) {
        // Recharger les informations de la base de données après un test réussi
        await loadDatabaseInfo();
        toast({
          title: "Succès",
          description: "La connexion à la base de données est établie.",
        });
      } else {
        setError("Le test de connexion a échoué. Vérifiez les paramètres de connexion.");
      }
    } catch (error) {
      console.error("Erreur lors du test de connexion à la base de données", error);
      setError(error instanceof Error ? error.message : "Échec du test de connexion à la base de données");
      toast({
        title: "Échec",
        description: "Impossible de se connecter à la base de données.",
        variant: "destructive",
      });
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
    error,
    loadDatabaseInfo,
    handleTestConnection
  };
};
