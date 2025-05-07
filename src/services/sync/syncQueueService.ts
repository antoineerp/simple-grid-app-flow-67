
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Types d'opérations de synchronisation
 */
export type SyncOperation = {
  id: string;
  type: 'bibliotheque' | 'membres' | 'documents' | 'exigences' | 'pilotage' | 'global';
  userId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
};

class SyncQueueManager {
  private queue: SyncOperation[] = [];
  private isProcessing: boolean = false;
  private maxRetries: number = 3;
  private storageKey: string = 'sync_queue';

  constructor() {
    this.loadQueue();
    // Tenter de traiter la file d'attente au démarrage
    this.processQueue();
    
    // Écouter les changements de connectivité pour réessayer les synchronisations
    window.addEventListener('online', () => {
      console.log('Connexion rétablie - Traitement de la file d\'attente de synchronisation');
      this.processQueue();
    });
  }

  /**
   * Ajoute une opération de synchronisation à la file d'attente
   */
  public addToQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): string {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();
    
    const newOperation: SyncOperation = {
      ...operation,
      id,
      timestamp,
      retryCount: 0,
      status: 'pending'
    };
    
    this.queue.push(newOperation);
    this.saveQueue();
    
    // Démarrer le traitement de la file d'attente si ce n'est pas déjà en cours
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return id;
  }

  /**
   * Traite la file d'attente de synchronisation
   */
  public async processQueue(): Promise<void> {
    // Si déjà en traitement ou si la file est vide, ne rien faire
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    // Si hors ligne, reporter le traitement
    if (!navigator.onLine) {
      console.log('Hors ligne - La file d\'attente sera traitée quand la connexion sera rétablie');
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Traiter les opérations en attente une par une
      const pendingOperations = this.queue.filter(op => op.status === 'pending');
      
      for (const operation of pendingOperations) {
        try {
          // Marquer l'opération comme en cours de traitement
          operation.status = 'processing';
          this.saveQueue();
          
          // Effectuer la synchronisation en fonction du type
          await this.performSync(operation);
          
          // Marquer l'opération comme réussie
          operation.status = 'completed';
          console.log(`Synchronisation réussie pour l'opération ${operation.id}`);
        } catch (error) {
          console.error(`Erreur lors de la synchronisation pour l'opération ${operation.id}:`, error);
          
          // Incrémenter le compteur de tentatives
          operation.retryCount++;
          
          if (operation.retryCount >= this.maxRetries) {
            // Abandonner après trop de tentatives
            operation.status = 'failed';
            operation.error = error instanceof Error ? error.message : String(error);
            console.error(`L'opération ${operation.id} a échoué après ${this.maxRetries} tentatives`);
          } else {
            // Remettre en attente pour une nouvelle tentative
            operation.status = 'pending';
          }
        }
      }
    } finally {
      // Nettoyer la file d'attente des opérations terminées avec succès
      this.queue = this.queue.filter(op => op.status !== 'completed');
      this.saveQueue();
      this.isProcessing = false;
      
      // Continuer à traiter s'il reste des opérations en attente
      if (this.queue.some(op => op.status === 'pending')) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  /**
   * Effectue la synchronisation en fonction du type d'opération
   */
  private async performSync(operation: SyncOperation): Promise<void> {
    const API_URL = getApiUrl();
    let endpoint: string;
    
    switch (operation.type) {
      case 'bibliotheque':
        endpoint = `${API_URL}/bibliotheque-sync.php`;
        break;
      case 'membres':
        endpoint = `${API_URL}/membres-sync.php`;
        break;
      case 'documents':
        endpoint = `${API_URL}/documents-sync.php`;
        break;
      case 'exigences':
        endpoint = `${API_URL}/exigences-sync.php`;
        break;
      case 'pilotage':
        endpoint = `${API_URL}/pilotage-sync.php`;
        break;
      case 'global':
        endpoint = `${API_URL}/global-sync.php`;
        break;
      default:
        throw new Error(`Type d'opération non pris en charge: ${operation.type}`);
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: operation.userId,
        ...operation.data
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Échec de la synchronisation (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Échec de la synchronisation');
    }
    
    return;
  }

  /**
   * Charge la file d'attente depuis le stockage local
   */
  private loadQueue(): void {
    const storedQueue = localStorage.getItem(this.storageKey);
    
    if (storedQueue) {
      try {
        this.queue = JSON.parse(storedQueue);
      } catch (error) {
        console.error('Erreur lors du chargement de la file d\'attente de synchronisation:', error);
        this.queue = [];
      }
    }
  }

  /**
   * Sauvegarde la file d'attente dans le stockage local
   */
  private saveQueue(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  /**
   * Obtient l'état actuel de la file d'attente
   */
  public getQueueStatus(): { 
    total: number; 
    pending: number; 
    processing: number; 
    failed: number; 
    hasFailures: boolean;
  } {
    const pending = this.queue.filter(op => op.status === 'pending').length;
    const processing = this.queue.filter(op => op.status === 'processing').length;
    const failed = this.queue.filter(op => op.status === 'failed').length;
    
    return {
      total: this.queue.length,
      pending,
      processing,
      failed,
      hasFailures: failed > 0
    };
  }

  /**
   * Réinitialise les opérations échouées pour une nouvelle tentative
   */
  public retryFailedOperations(): void {
    for (const operation of this.queue) {
      if (operation.status === 'failed') {
        operation.status = 'pending';
        operation.retryCount = 0;
      }
    }
    
    this.saveQueue();
    this.processQueue();
  }

  /**
   * Efface les opérations échouées de la file d'attente
   */
  public clearFailedOperations(): void {
    this.queue = this.queue.filter(op => op.status !== 'failed');
    this.saveQueue();
  }
}

// Instance singleton du gestionnaire de file d'attente
export const syncQueueManager = new SyncQueueManager();

