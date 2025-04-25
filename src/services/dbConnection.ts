
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

/**
 * Service simplifié pour gérer la connexion à la base de données
 */

export type DatabaseConnectionResult = {
  status: 'success' | 'error';
  message: string;
  database?: {
    host: string;
    name: string;
    tables_count: number;
    tables_sample: string[];
    mysql_version: string;
  };
  error?: string;
  code?: number;
  timestamp?: string;
};

/**
 * Teste la connexion à la base de données (version simplifiée)
 */
export const testDatabaseConnection = async (): Promise<DatabaseConnectionResult> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/db-connection-simple.php`;
    console.log(`Test de connexion à la base de données via: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      
      try {
        const errorJson = await response.json();
        return errorJson;
      } catch (parseError) {
        return {
          status: 'error',
          message: `Erreur HTTP ${response.status}`,
          error: `${response.statusText} - Impossible de parser la réponse JSON`
        };
      }
    }
    
    const result = await response.json();
    console.log("Résultat du test de connexion:", result);
    
    return result;
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
    return {
      status: 'error',
      message: 'Erreur de connexion',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Hook pour utiliser le service de connexion à la base de données
 */
export const useDatabaseConnection = () => {
  const { toast } = useToast();
  
  const testConnection = async (showToast = true): Promise<DatabaseConnectionResult> => {
    try {
      const result = await testDatabaseConnection();
      
      if (showToast) {
        if (result.status === 'success') {
          toast({
            title: "Connexion réussie",
            description: `Connecté à ${result.database?.name} sur ${result.database?.host}`,
          });
        } else {
          toast({
            title: "Échec de connexion",
            description: result.message || "Impossible de se connecter à la base de données",
            variant: "destructive",
          });
        }
      }
      
      return result;
    } catch (error) {
      if (showToast) {
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors du test de connexion",
          variant: "destructive",
        });
      }
      
      return {
        status: 'error',
        message: 'Erreur inattendue',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };
  
  return {
    testConnection
  };
};
