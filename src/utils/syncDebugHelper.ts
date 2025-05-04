
/**
 * Utilitaires pour diagnostiquer et réparer les problèmes de synchronisation côté client
 */

import { toast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { getAuthHeaders } from '@/services/auth/authService';
import { clearAllSyncTasks } from '@/features/sync/utils/syncQueue';

// URL de base pour les opérations de diagnostic
const getDebugApiUrl = () => {
  const apiUrl = getApiUrl();
  return `${apiUrl}/sync-debug.php`;
};

/**
 * Réparer l'historique de synchronisation pour l'utilisateur actuel
 */
export const repairSyncHistory = async (): Promise<boolean> => {
  const userId = getCurrentUser() || 'p71x6d_system';
  const url = `${getDebugApiUrl()}?action=repair_sync&userId=${userId}`;
  
  try {
    // Afficher un toast pour indiquer que l'opération est en cours
    toast({
      title: "Réparation en cours",
      description: "Tentative de réparation de l'historique de synchronisation...",
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      toast({
        title: "Réparation réussie",
        description: `${result.repaired_count} problèmes corrigés dans l'historique de synchronisation.`,
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Échec de la réparation",
        description: result.message || "Une erreur est survenue lors de la réparation.",
      });
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    toast({
      variant: "destructive",
      title: "Erreur lors de la réparation",
      description: errorMessage,
    });
    return false;
  }
};

/**
 * Vérifier et réparer les tables de l'utilisateur actuel
 */
export const checkAndRepairTables = async (): Promise<boolean> => {
  const userId = getCurrentUser() || 'p71x6d_system';
  const url = `${getDebugApiUrl()}?action=check_tables&userId=${userId}`;
  
  try {
    toast({
      title: "Vérification des tables",
      description: "Vérification et réparation des tables utilisateur...",
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Compter le nombre de tables créées ou réparées
      const repairedTables = Object.values(result.tables_status).filter(
        (table: any) => table.status === 'created'
      ).length;
      
      toast({
        title: "Vérification terminée",
        description: `${repairedTables} tables ont été créées ou réparées.`,
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Échec de la vérification",
        description: result.message || "Une erreur est survenue lors de la vérification des tables.",
      });
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    toast({
      variant: "destructive",
      title: "Erreur lors de la vérification",
      description: errorMessage,
    });
    return false;
  }
};

/**
 * Réinitialiser complètement la synchronisation (client + serveur)
 */
export const resetSynchronization = async (): Promise<boolean> => {
  const userId = getCurrentUser() || 'p71x6d_system';
  
  try {
    toast({
      title: "Réinitialisation de la synchronisation",
      description: "Nettoyage de la file d'attente locale...",
    });
    
    // 1. Réinitialiser côté client
    clearAllSyncTasks();
    
    // Nettoyer le localStorage pour les indicateurs de synchronisation
    const keysToClean = ['sync_in_progress_', 'last_sync_', 'sync_pending_'];
    const tables = ['documents', 'exigences', 'membres', 'bibliotheque', 'collaboration', 'collaboration_groups', 'test_table'];
    
    tables.forEach(table => {
      keysToClean.forEach(prefix => {
        localStorage.removeItem(`${prefix}${table}`);
      });
    });
    
    // 2. Réinitialiser côté serveur
    toast({
      title: "Réinitialisation de la synchronisation",
      description: "Réinitialisation de la file d'attente côté serveur...",
    });
    
    const url = `${getDebugApiUrl()}?action=reset_queue&userId=${userId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      toast({
        title: "Réinitialisation terminée",
        description: "La synchronisation a été complètement réinitialisée. Veuillez recharger la page.",
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Échec partiel de la réinitialisation",
        description: "La partie cliente a été réinitialisée, mais la partie serveur a échoué.",
      });
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    toast({
      variant: "destructive",
      title: "Erreur lors de la réinitialisation",
      description: errorMessage,
    });
    return false;
  }
};

/**
 * Vérifier l'état de synchronisation pour l'utilisateur actuel
 */
export const checkSyncStatus = async (): Promise<any> => {
  const userId = getCurrentUser() || 'p71x6d_system';
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/sync-status.php?userId=${userId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      toast({
        title: "État de synchronisation",
        description: `${result.tables_count} tables synchronisées. Dernière synchronisation: ${result.last_sync}.`,
      });
      return result;
    } else {
      toast({
        variant: "destructive",
        title: "Échec de vérification",
        description: result.message || "Une erreur est survenue lors de la vérification de l'état de synchronisation.",
      });
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    toast({
      variant: "destructive", 
      title: "Erreur de vérification",
      description: errorMessage,
    });
    return null;
  }
};

// Exposer un objet avec toutes les fonctions de débogage
export const syncDebugger = {
  repairSyncHistory,
  checkAndRepairTables,
  resetSynchronization,
  checkSyncStatus
};

// Exposer au niveau global pour le débogage dans la console
if (typeof window !== 'undefined') {
  (window as any).syncDebugger = syncDebugger;
}
