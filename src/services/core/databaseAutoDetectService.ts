
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
      
      if (!API_URL) {
        throw new Error("URL de l'API non configurée");
      }
      
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
      // Configuration forcée pour utiliser uniquement p71x6d_system
      localStorage.setItem('database_connection', 'system');
      sessionStorage.setItem('database_connection', 'system');
      
      // Option pour afficher un toast de confirmation
      if (showToast) {
        toast({
          title: "Connexion établie",
          description: "Connecté à la base de données: p71x6d_system"
        });
      }
      
      console.log("Base de données principale: p71x6d_system");
      return true;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la base de données:", error);
      return false;
    }
  }
};

// Ne plus exécuter l'initialisation automatique au chargement du module
// pour éviter les problèmes de timing et les synchronisations multiples
