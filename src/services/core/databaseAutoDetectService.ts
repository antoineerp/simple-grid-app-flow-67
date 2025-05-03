
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
    // Toujours utiliser p71x6d_system sans détection automatique
    localStorage.setItem('database_connection', 'system');
    
    if (showToast) {
      toast({
        title: "Connexion établie",
        description: "Connecté à la base de données: p71x6d_system"
      });
    }
    
    console.log("Base de données principale: p71x6d_system");
    return true;
  }
};

// Exécuter l'initialisation automatique au chargement de l'application
if (typeof window !== 'undefined') {
  databaseAutoDetectService.initialize(false)
    .then(success => {
      console.log(`Initialisation de la base de données ${success ? 'réussie' : 'échouée'}`);
    });
}
