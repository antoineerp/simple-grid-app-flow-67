
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/components/ui/use-toast';

interface DatabaseStatus {
  status: string;
  working_connections: string[];
  primary_db: string | null;
  message: string;
}

/**
 * Service pour détecter automatiquement la base de données disponible
 */
export const databaseAutoDetectService = {
  /**
   * Détecte automatiquement la base de données disponible
   */
  async detectAvailableDatabase(): Promise<DatabaseStatus | null> {
    try {
      console.log("Détection automatique de la base de données...");
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/db-autoswitch.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Résultat de la détection:", data);
      
      return data;
    } catch (error) {
      console.error("Erreur lors de la détection de la base de données:", error);
      return null;
    }
  },
  
  /**
   * Initialise l'application avec la base de données disponible
   */
  async initialize(showToast: boolean = true): Promise<boolean> {
    try {
      const result = await this.detectAvailableDatabase();
      
      if (!result || !result.primary_db) {
        if (showToast) {
          toast({
            title: "Problème de connexion",
            description: "Aucune base de données disponible. L'application peut ne pas fonctionner correctement.",
            variant: "destructive"
          });
        }
        return false;
      }
      
      // Stocker l'information localement
      localStorage.setItem('database_connection', result.primary_db);
      
      if (showToast) {
        toast({
          title: "Connexion établie",
          description: `Connecté à la base de données: ${result.primary_db}`
        });
      }
      
      console.log(`Base de données principale détectée: ${result.primary_db}`);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la base de données:", error);
      return false;
    }
  }
};

// Exécuter l'initialisation automatique au chargement de l'application
if (typeof window !== 'undefined') {
  databaseAutoDetectService.initialize(false)
    .then(success => {
      console.log(`Initialisation de la base de données ${success ? 'réussie' : 'échouée'}`);
    });
}
