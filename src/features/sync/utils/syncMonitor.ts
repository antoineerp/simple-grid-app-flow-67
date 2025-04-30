
/**
 * Moniteur global de synchronisation
 * Fournit un point central pour surveiller et coordonner toutes les opérations de sync
 */

import { getRecentErrors } from './errorLogger';
import { SyncMonitorStatus } from '../types/syncTypes';

// Types pour le monitoring
export type SyncAttempt = {
  id: string;
  tableName: string;
  operation: string;
  startTime: number;
  endTime?: number;
  success: boolean; // Changed from optional to required
  error?: string;
  duration?: number;
};

interface SyncMonitorState {
  attempts: SyncAttempt[];
  activeOperations: Map<string, SyncAttempt>;
  successCount: number;
  failureCount: number;
  lastSync: {
    time: number | null;
    success: boolean;
  };
}

class SyncMonitor {
  private state: SyncMonitorState;
  private static instance: SyncMonitor;
  private maxHistorySize = 50;
  
  private constructor() {
    this.state = {
      attempts: [],
      activeOperations: new Map(),
      successCount: 0,
      failureCount: 0,
      lastSync: {
        time: null,
        success: false
      }
    };
    
    // Initialiser le système d'écoute d'événements
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }
  
  /**
   * Obtenir l'instance singleton du moniteur
   */
  public static getInstance(): SyncMonitor {
    if (!SyncMonitor.instance) {
      SyncMonitor.instance = new SyncMonitor();
    }
    return SyncMonitor.instance;
  }
  
  /**
   * Mettre en place les écouteurs d'événements
   */
  private setupEventListeners(): void {
    // Écouter les événements de synchronisation
    window.addEventListener('syncStarted', ((event: CustomEvent) => {
      this.recordSyncStart(event.detail.tableName, event.detail.operation || 'unknown');
    }) as EventListener);
    
    window.addEventListener('syncCompleted', ((event: CustomEvent) => {
      this.recordSyncEnd(event.detail.tableName, true);
    }) as EventListener);
    
    window.addEventListener('syncFailed', ((event: CustomEvent) => {
      this.recordSyncEnd(event.detail.tableName, false, event.detail.error);
    }) as EventListener);
  }
  
  /**
   * Enregistrer le début d'une synchronisation
   */
  public recordSyncStart(tableName: string, operation: string): string {
    const timestamp = Date.now();
    const id = `${tableName}_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    
    const attempt: SyncAttempt = {
      id,
      tableName,
      operation,
      startTime: timestamp,
      success: false // Initialize with a default value to make it non-optional
    };
    
    // Stocker l'opération active
    this.state.activeOperations.set(id, attempt);
    
    // Émettre un événement pour le débogage
    console.log(`SyncMonitor: Début synchronisation ${tableName} (${operation}) avec ID ${id}`);
    
    return id;
  }
  
  /**
   * Enregistrer la fin d'une synchronisation
   */
  public recordSyncEnd(id: string, success: boolean, error?: string): void {
    // Récupérer l'opération
    const operation = this.state.activeOperations.get(id);
    
    if (!operation) {
      console.warn(`SyncMonitor: Opération inconnue ${id}`);
      return;
    }
    
    // Mettre à jour l'opération
    operation.endTime = Date.now();
    operation.success = success;
    operation.error = error;
    operation.duration = operation.endTime - operation.startTime;
    
    // Mettre à jour les compteurs
    if (success) {
      this.state.successCount++;
      this.state.lastSync = { time: operation.endTime, success: true };
    } else {
      this.state.failureCount++;
      if (!this.state.lastSync.time) {
        this.state.lastSync = { time: operation.endTime, success: false };
      }
    }
    
    // Ajouter à l'historique et respecter la taille maximale
    this.state.attempts.unshift(operation);
    if (this.state.attempts.length > this.maxHistorySize) {
      this.state.attempts = this.state.attempts.slice(0, this.maxHistorySize);
    }
    
    // Supprimer de la liste des opérations actives
    this.state.activeOperations.delete(id);
    
    // Log pour débogage
    console.log(`SyncMonitor: Fin synchronisation ${operation.tableName} (${success ? 'succès' : 'échec'})`);
  }
  
  /**
   * Récupérer l'état actuel de toutes les synchronisations
   */
  public getStatus(): SyncMonitorStatus {
    const activeCount = this.state.activeOperations.size;
    const recentErrors = getRecentErrors();
    
    // Déterminer l'état de santé global
    let health: 'good' | 'warning' | 'critical' = 'good';
    
    if (this.state.failureCount > this.state.successCount) {
      health = 'critical';
    } else if (this.state.failureCount > 0) {
      health = 'warning';
    }
    
    return {
      activeCount,
      recentAttempts: this.state.attempts.slice(0, 10),
      stats: {
        success: this.state.successCount,
        failure: this.state.failureCount
      },
      health,
      lastSync: this.state.lastSync
    };
  }
  
  /**
   * Récupérer les opérations de synchronisation actives
   */
  public getActiveOperations(): SyncAttempt[] {
    return Array.from(this.state.activeOperations.values());
  }
  
  /**
   * Vérifier si une table a une synchronisation en cours
   */
  public hasActiveSync(tableName: string): boolean {
    for (const operation of this.state.activeOperations.values()) {
      if (operation.tableName === tableName) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Réinitialiser les compteurs et l'état
   */
  public reset(): void {
    this.state.successCount = 0;
    this.state.failureCount = 0;
    // Ne pas réinitialiser les opérations actives ni l'historique
  }
}

// Exporter l'instance singleton
export const syncMonitor = SyncMonitor.getInstance();
