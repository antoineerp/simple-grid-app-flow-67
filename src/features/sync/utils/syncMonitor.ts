
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
  operation: string; // Required for compatibility with SyncMonitorStatus
  startTime: number;
  endTime?: number;
  success: boolean;
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
      this.recordSyncStart(
        event.detail.operationId || event.detail.tableName, 
        event.detail.operation || 'unknown'
      );
    }) as EventListener);
    
    window.addEventListener('syncCompleted', ((event: CustomEvent) => {
      this.recordSyncEnd(event.detail.operationId || event.detail.tableName, true);
    }) as EventListener);
    
    window.addEventListener('syncFailed', ((event: CustomEvent) => {
      this.recordSyncEnd(
        event.detail.operationId || event.detail.tableName, 
        false, 
        event.detail.error
      );
    }) as EventListener);
  }
  
  /**
   * Enregistrer le début d'une synchronisation
   */
  public recordSyncStart(id: string, operation: string): string {
    const timestamp = Date.now();
    const operationId = id.includes('_') ? id : `${id}_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    
    const attempt: SyncAttempt = {
      id: operationId,
      tableName: id.includes('_') ? id.split('_')[0] : id,
      operation,
      startTime: timestamp,
      success: false
    };
    
    // Stocker l'opération active
    this.state.activeOperations.set(operationId, attempt);
    
    // Émettre un événement pour le débogage
    console.log(`SyncMonitor: Début synchronisation ${attempt.tableName} (${operation}) avec ID ${operationId}`);
    
    return operationId;
  }
  
  /**
   * Enregistrer la fin d'une synchronisation
   */
  public recordSyncEnd(id: string, success: boolean, error?: string): void {
    // Vérifier si c'est un ID d'opération (contenant _) ou juste un nom de table
    const isOperationId = id.includes('_');
    
    // Récupérer l'opération
    let operation;
    let opId = id;
    
    if (isOperationId) {
      operation = this.state.activeOperations.get(id);
    } else {
      // Rechercher parmi toutes les opérations actives pour trouver celle qui correspond au nom de table
      for (const [currentOpId, op] of this.state.activeOperations.entries()) {
        if (op.tableName === id) {
          operation = op;
          opId = currentOpId;
          break;
        }
      }
    }
    
    if (!operation) {
      console.warn(`SyncMonitor: Opération inconnue ${id} (ignorée silencieusement)`);
      
      // AMÉLIORATION: Créer une nouvelle entrée pour cette opération inconnue
      // pour éviter les erreurs dans l'historique
      const newOperation: SyncAttempt = {
        id: opId,
        tableName: isOperationId ? id.split('_')[0] : id,
        operation: 'unknown',
        startTime: Date.now() - 1000, // Simuler un début 1 seconde avant
        success: success,
        endTime: Date.now(),
        error: error || (success ? undefined : "Opération inconnue")
      };
      
      // Ajouter à l'historique
      this.state.attempts.unshift(newOperation);
      if (this.state.attempts.length > this.maxHistorySize) {
        this.state.attempts = this.state.attempts.slice(0, this.maxHistorySize);
      }
      
      // Mettre à jour les compteurs
      if (success) {
        this.state.successCount++;
        this.state.lastSync = { time: newOperation.endTime, success: true };
      } else {
        this.state.failureCount++;
        if (!this.state.lastSync.time) {
          this.state.lastSync = { time: newOperation.endTime, success: false };
        }
      }
      
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
    this.state.activeOperations.delete(opId);
    
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
