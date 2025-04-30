
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
    const keys = Object.keys(localStorage).filter(key => key.startsWith('last_sync_action_'));
    
    keys.forEach(key => {
      const tableName = key.replace('last_sync_action_', '');
      const entry = safeLocalStorageGet<SyncLogEntry>(key, null);
      if (entry) {
        result[tableName] = entry;
      }
    });
    
    return result;
  },

  /**
   * Efface le journal de synchronisation
   */
  clearSyncLog: (): void => {
    safeLocalStorageSet('sync_debug_log', []);
    
    // Supprimer également les dernières actions
    const keys = Object.keys(localStorage).filter(key => key.startsWith('last_sync_action_'));
    keys.forEach(key => localStorage.removeItem(key));
    
    console.log('[SyncLog] Journal de synchronisation effacé');
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
      trigger: detail.trigger
    });
  });

  window.addEventListener('syncFailed', (event) => {
    const detail = (event as CustomEvent).detail;
    SyncLoggingService.logSyncAction('failed', detail.tableName, false, {
      operationId: detail.operationId,
      error: detail.error
    });
  });
  
  window.addEventListener('sync-data-changed', (event) => {
    const detail = (event as CustomEvent).detail;
    SyncLoggingService.logSyncAction('data-changed', 'global', true, {
      timestamp: detail.timestamp
    });
  });
}
