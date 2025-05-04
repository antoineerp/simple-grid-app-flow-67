
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUserId } from '@/services/core/userService';
import { toast } from '@/components/ui/use-toast';

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
  },

  /**
   * Répare spécifiquement l'ID problématique
   */
  async repairProblemId(id: string = "002ecca6-dc39-468d-a6ce-a1aed0264383"): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      const API_URL = getApiUrl();
      
      if (!API_URL || !userId) {
        console.error("Configuration manquante pour réparer l'ID problématique");
        return false;
      }
      
      console.log(`Tentative de réparation de l'ID problématique: ${id}`);
      
      const response = await fetch(`${API_URL}/sync-debug.php?userId=${userId}&action=fix_id&problem_id=${encodeURIComponent(id)}`, {
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
      console.log("Réparation de l'ID problématique:", data);
      return data.success === true;
    } catch (error) {
      console.error("Erreur lors de la réparation de l'ID problématique:", error);
      return false;
    }
  },

  /**
   * Nettoie le stockage local pour forcer le rechargement des données
   */
  cleanLocalStorage(): void {
    try {
      const userId = getCurrentUserId() || 'default';
      // Nettoyer les données de membres et les paramètres de synchronisation
      localStorage.removeItem(`membres_${userId}`);
      localStorage.removeItem(`lastServerSync_membres_${userId}`);
      localStorage.removeItem(`sync_in_progress_membres`);
      localStorage.removeItem(`last_sync_id_membres`);
      localStorage.removeItem(`sync_pending_membres`);
      localStorage.removeItem(`membres_${userId}_last_saved`);
      
      // Nettoyer aussi les anciennes clés de stockage
      localStorage.removeItem('membres');
      sessionStorage.removeItem('membres');
      
      console.log("Stockage local nettoyé avec succès");
    } catch (error) {
      console.error("Erreur lors du nettoyage du stockage local:", error);
    }
  },

  /**
   * Méthode complète de réparation pour résoudre les erreurs d'insertion de membres
   */
  async repairMemberInsertionErrors(): Promise<boolean> {
    try {
      // 1. Afficher un message de chargement
      toast({
        title: "Réparation en cours",
        description: "Réparation des erreurs de synchronisation des membres...",
      });

      // 2. Nettoyer d'abord le stockage local
      this.cleanLocalStorage();

      // 3. Réparer l'ID problématique connu
      await this.repairProblemId();

      // 4. Supprimer les duplications dans l'historique de synchronisation
      await this.removeDuplicates();

      // 5. Vérifier et réparer les tables
      await this.checkAndRepairTables();

      // 6. Réinitialiser la file d'attente
      await this.resetSyncQueue();

      // 7. Réparer l'historique de synchronisation
      await this.repairSyncHistory();

      // 8. Message de succès
      toast({
        title: "Réparation terminée",
        description: "Les problèmes de synchronisation ont été réparés. Veuillez recharger l'application.",
      });

      return true;
    } catch (error) {
      console.error("Erreur lors de la réparation complète:", error);
      
      toast({
        variant: "destructive",
        title: "Erreur de réparation",
        description: "Impossible de réparer complètement les erreurs. Veuillez contacter le support technique.",
      });
      
      return false;
    }
  }
};
