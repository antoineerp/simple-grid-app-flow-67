
/**
 * Service pour enregistrer les détails de synchronisation pour le débogage
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { safeLocalStorageSet, safeLocalStorageGet } from '@/utils/syncStorageCleaner';

interface SyncLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  tableName: string;
  details?: any;
  success: boolean;
}

// Nombre maximum d'entrées de journal à conserver
const MAX_LOG_ENTRIES = 50;

export const SyncLoggingService = {
  /**
   * Ajoute une entrée dans le journal de synchronisation
   */
  logSyncAction: (action: string, tableName: string, success: boolean, details?: any): void => {
    try {
      const userId = getCurrentUser() || 'unknown';
      const entry: SyncLogEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action,
        tableName,
        details,
        success
      };

      // Récupérer le journal existant
      const existingLog = safeLocalStorageGet<SyncLogEntry[]>('sync_debug_log', []);
      
      // Ajouter la nouvelle entrée au début
      const updatedLog = [entry, ...existingLog.slice(0, MAX_LOG_ENTRIES - 1)];
      
      // Sauvegarder le journal mis à jour
      safeLocalStorageSet('sync_debug_log', updatedLog);
      
      // Enregistrer également la dernière action de synchronisation pour cette table
      safeLocalStorageSet(`last_sync_action_${tableName}`, entry);
      
      // Si la synchronisation échoue, le signaler spécifiquement
      if (!success) {
        safeLocalStorageSet(`sync_error_${tableName}`, {
          timestamp: new Date().toISOString(),
          details: details || 'Erreur inconnue',
          action
        });
      } else {
        // En cas de succès, effacer les erreurs précédentes si elles existent
        try {
          localStorage.removeItem(`sync_error_${tableName}`);
        } catch (e) {
          // Ignorer les erreurs, simplement pour nettoyer
        }
      }
      
      console.log(`[SyncLog] ${userId} - ${action} - ${tableName} - ${success ? 'Succès' : 'Échec'}`);
    } catch (error) {
      console.error('Erreur lors de la journalisation de synchronisation:', error);
    }
  },

  /**
   * Récupère le journal de synchronisation complet
   */
  getSyncLog: (): SyncLogEntry[] => {
    return safeLocalStorageGet<SyncLogEntry[]>('sync_debug_log', []);
  },

  /**
   * Récupère les dernières actions pour chaque table
   */
  getLastActions: (): Record<string, SyncLogEntry> => {
    const result: Record<string, SyncLogEntry> = {};
    
    // Rechercher toutes les clés de dernière action
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('last_sync_action_'));
      
      keys.forEach(key => {
        const tableName = key.replace('last_sync_action_', '');
        const entry = safeLocalStorageGet<SyncLogEntry>(key, null);
        if (entry) {
          result[tableName] = entry;
        }
      });
    }
    
    return result;
  },

  /**
   * Récupère toutes les erreurs de synchronisation récentes
   */
  getSyncErrors: (): Record<string, any> => {
    const result: Record<string, any> = {};
    
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('sync_error_'));
      
      keys.forEach(key => {
        const tableName = key.replace('sync_error_', '');
        const entry = safeLocalStorageGet<any>(key, null);
        if (entry) {
          result[tableName] = entry;
        }
      });
    }
    
    return result;
  },

  /**
   * Efface le journal de synchronisation
   */
  clearSyncLog: (): void => {
    safeLocalStorageSet('sync_debug_log', []);
    
    // Supprimer également les dernières actions
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('last_sync_action_') || 
        key.startsWith('sync_error_')
      );
      
      keys.forEach(key => localStorage.removeItem(key));
    }
    
    console.log('[SyncLog] Journal de synchronisation effacé');
  },
  
  /**
   * Vérifie si une table a des erreurs de synchronisation récentes
   */
  hasRecentErrors: (tableName: string): boolean => {
    try {
      const errorData = safeLocalStorageGet(`sync_error_${tableName}`, null);
      if (!errorData) return false;
      
      // Vérifier si l'erreur date de moins de 10 minutes
      const errorTime = new Date(errorData.timestamp).getTime();
      const now = new Date().getTime();
      const minutesSinceError = (now - errorTime) / (1000 * 60);
      
      return minutesSinceError < 10;
    } catch (error) {
      console.error('Erreur lors de la vérification des erreurs récentes:', error);
      return false;
    }
  },
  
  /**
   * Vérifie si un groupe a été correctement configuré
   */
  validateGroupStructure: (groupData: any): boolean => {
    try {
      // Vérifier si le groupe a les propriétés minimales requises
      if (!groupData || typeof groupData !== 'object') return false;
      if (!groupData.id || typeof groupData.id !== 'string') return false;
      if (!groupData.name || typeof groupData.name !== 'string') return false;
      if (typeof groupData.expanded !== 'boolean') return false;
      if (!Array.isArray(groupData.items)) return false;
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la validation du groupe:', error);
      return false;
    }
  }
};

// Ajouter des écouteurs d'événements pour journaliser automatiquement
if (typeof window !== 'undefined') {
  window.addEventListener('syncStarted', (event) => {
    const detail = (event as CustomEvent).detail;
    SyncLoggingService.logSyncAction('start', detail.tableName, true, {
      operationId: detail.operationId,
      trigger: detail.trigger
    });
  });

  window.addEventListener('syncCompleted', (event) => {
    const detail = (event as CustomEvent).detail;
    SyncLoggingService.logSyncAction('complete', detail.tableName, true, {
      operationId: detail.operationId,
      trigger: detail.trigger,
      dataSize: detail.dataSize || 'inconnu'
    });
  });

  window.addEventListener('syncFailed', (event) => {
    const detail = (event as CustomEvent).detail;
    SyncLoggingService.logSyncAction('failed', detail.tableName, false, {
      operationId: detail.operationId,
      error: detail.error || detail.message || 'Erreur inconnue'
    });
  });
  
  window.addEventListener('sync-data-changed', (event) => {
    const detail = (event as CustomEvent).detail;
    SyncLoggingService.logSyncAction('data-changed', detail.tableName || 'global', true, {
      timestamp: detail.timestamp
    });
  });
  
  // Ajouter un écouteur pour les événements de changement d'utilisateur
  window.addEventListener('database-user-changed', (event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && detail.user) {
      SyncLoggingService.logSyncAction('user-changed', 'global', true, {
        user: detail.user
      });
    }
  });
  
  // Ajouter un écouteur pour les groupes modifiés
  window.addEventListener('group-toggle', (event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && detail.groupId) {
      SyncLoggingService.logSyncAction('group-toggle', detail.tableName || 'unknown', true, {
        groupId: detail.groupId,
        expanded: detail.expanded
      });
    }
  });
}
