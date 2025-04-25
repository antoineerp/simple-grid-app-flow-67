
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

/**
 * Service pour gérer la connexion à la base de données
 */

export type DatabaseConnectionResult = {
  status: 'success' | 'error';
  message: string;
  database?: {
    host: string;
    name: string;
    tables_count: number;
    tables: string[];
    mysql_version: string;
  };
  error?: string;
  code?: number;
  timestamp?: string;
};

/**
 * Teste la connexion à la base de données
 */
export const testDatabaseConnection = async (): Promise<DatabaseConnectionResult> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/test-db-connection.php`;
    console.log(`Test de connexion à la base de données via: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      
      // Essayer d'extraire des informations d'erreur
      const errorText = await response.text();
      console.error("Contenu de la réponse:", errorText);
      
      try {
        // Tenter de parser comme JSON
        const errorJson = JSON.parse(errorText);
        return errorJson;
      } catch (parseError) {
        // Si ce n'est pas du JSON, renvoyer une erreur structurée
        return {
          status: 'error',
          message: `Erreur HTTP ${response.status}`,
          error: errorText.substring(0, 100)
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
 * Vérifie l'état de la connexion API sans toucher à la base de données
 */
export const checkApiConnection = async (): Promise<any> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/check-connection.php`;
    console.log(`Vérification de la connexion API via: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    const result = await response.json();
    console.log("Résultat de la vérification API:", result);
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la vérification API:', error);
    return {
      status: 'error',
      message: 'Erreur de connexion API',
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
    testConnection,
    checkApiConnection
  };
};
