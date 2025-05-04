
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUserId } from '@/services/core/userService';

/**
 * Outil de réparation et de diagnostic pour la synchronisation
 */
export const syncRepairTool = {
  /**
   * Répare l'historique de synchronisation
   */
  async repairSyncHistory(): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      const API_URL = getApiUrl();
      
      if (!API_URL || !userId) {
        console.error("Configuration manquante pour réparer la synchronisation");
        return false;
      }
      
      const response = await fetch(`${API_URL}/sync-debug.php?userId=${userId}&action=repair_sync`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      console.log("Réparation de l'historique:", data);
      return data.success === true;
    } catch (error) {
      console.error("Erreur lors de la réparation de l'historique:", error);
      return false;
    }
  },
  
  /**
   * Vérifie et répare les tables pour un utilisateur
   */
  async checkAndRepairTables(): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      const API_URL = getApiUrl();
      
      if (!API_URL || !userId) {
        console.error("Configuration manquante pour vérifier les tables");
        return false;
      }
      
      const response = await fetch(`${API_URL}/sync-debug.php?userId=${userId}&action=check_tables`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      console.log("Vérification des tables:", data);
      return data.success === true;
    } catch (error) {
      console.error("Erreur lors de la vérification des tables:", error);
      return false;
    }
  },
  
  /**
   * Réinitialise la file d'attente de synchronisation
   */
  async resetSyncQueue(): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      const API_URL = getApiUrl();
      
      if (!API_URL || !userId) {
        console.error("Configuration manquante pour réinitialiser la file d'attente");
        return false;
      }
      
      const response = await fetch(`${API_URL}/sync-debug.php?userId=${userId}&action=reset_queue`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      console.log("Réinitialisation de la file d'attente:", data);
      return data.success === true;
    } catch (error) {
      console.error("Erreur lors de la réinitialisation de la file d'attente:", error);
      return false;
    }
  },
  
  /**
   * Supprime les entrées dupliquées dans l'historique
   */
  async removeDuplicates(): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      const API_URL = getApiUrl();
      
      if (!API_URL || !userId) {
        console.error("Configuration manquante pour supprimer les duplications");
        return false;
      }
      
      const response = await fetch(`${API_URL}/sync-debug.php?userId=${userId}&action=remove_duplicates`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      console.log("Suppression des duplications:", data);
      return data.success === true;
    } catch (error) {
      console.error("Erreur lors de la suppression des duplications:", error);
      return false;
    }
  }
};
