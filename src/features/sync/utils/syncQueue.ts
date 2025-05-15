
/**
 * Gestionnaire de file d'attente pour les opérations de synchronisation
 * Assure que les opérations se déroulent de manière strictement séquentielle
 */

type SyncTask = {
  id: string;
  tableName: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  createdAt: number;
  priority: number; // Plus le nombre est bas, plus la priorité est élevée
};

class SyncQueueManager {
  private queue: SyncTask[] = [];
  private processing: boolean = false;
  private currentTask: SyncTask | null = null;
  private taskTimeout: number = 15000; // 15 secondes maximum par tâche
  private abortControllers: Map<string, AbortController> = new Map();
  private globalLock: boolean = false;
  private lastProcessingTime: number = 0;

  /**
   * Ajouter une tâche à la file d'attente
   */
  public enqueue<T>(tableName: string, task: () => Promise<T>, priority: number = 5): Promise<T> {
    const taskId = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`SyncQueue: Ajout de la tâche ${taskId} à la file d'attente (priorité: ${priority})`);

    // Créer une nouvelle promesse qui sera résolue lorsque la tâche sera exécutée
    return new Promise<T>((resolve, reject) => {
      const syncTask: SyncTask = {
        id: taskId,
        tableName,
        execute: task,
        resolve,
        reject,
        createdAt: Date.now(),
        priority
      };

      // Ajouter la tâche à la file d'attente et trier par priorité
      this.queue.push(syncTask);
      this.queue.sort((a, b) => a.priority - b.priority);
      
      console.log(`SyncQueue: File d'attente contient ${this.queue.length} tâches`);
      
      // Démarrer le traitement si ce n'est pas déjà en cours
      if (!this.processing && !this.globalLock) {
        this.processQueue().catch(error => {
          console.error(`SyncQueue: Erreur lors du traitement de la file d'attente:`, error);
        });
      } else {
        console.log(`SyncQueue: Traitement déjà en cours ou système verrouillé, la tâche sera exécutée plus tard`);
      }
    });
  }

  /**
   * Traiter la file d'attente de manière strictement séquentielle
   */
  private async processQueue() {
    if (this.processing || this.globalLock) {
      console.log(`SyncQueue: Traitement déjà en cours ou système verrouillé, attente...`);
      return;
    }

    this.processing = true;
    this.globalLock = true;
    
    try {
      // D'abord, attendre un court délai entre les traitements
      const timeSinceLastProcessing = Date.now() - this.lastProcessingTime;
      if (timeSinceLastProcessing < 1000 && this.lastProcessingTime > 0) {
        const waitTime = 1000 - timeSinceLastProcessing;
        console.log(`SyncQueue: Attente de ${waitTime}ms avant le prochain traitement`);
        await new Promise(r => setTimeout(r, waitTime));
      }
      
      this.lastProcessingTime = Date.now();
      
      while (this.queue.length > 0) {
        // Récupérer la prochaine tâche
        this.currentTask = this.queue.shift()!;
        const { id, tableName, execute, resolve, reject, createdAt } = this.currentTask;
        
        console.log(`SyncQueue: Exécution de la tâche ${id} pour ${tableName}`);

        // Attendre un court délai entre les tâches pour garantir la séparation
        await new Promise(r => setTimeout(r, 300));
        
        // Vérifier si la tâche est trop ancienne (plus de 2 minutes)
        if (Date.now() - createdAt > 120000) {
          console.warn(`SyncQueue: La tâche ${id} est trop ancienne (${Math.round((Date.now() - createdAt)/1000)}s), annulation`);
          reject(new Error("La tâche a expiré"));
          this.currentTask = null;
          continue;
        }

        // Créer un AbortController pour cette tâche
        const abortController = new AbortController();
        this.abortControllers.set(id, abortController);

        try {
          // Configurer un timeout pour cette tâche
          const timeoutId = setTimeout(() => {
            abortController.abort();
            console.warn(`SyncQueue: Timeout de la tâche ${id} après ${this.taskTimeout}ms`);
          }, this.taskTimeout);

          try {
            // Exécuter la tâche
            const result = await execute();
            
            // Nettoyage du timeout
            clearTimeout(timeoutId);
            
            console.log(`SyncQueue: Tâche ${id} terminée avec succès`);
            resolve(result);
          } catch (error) {
            // Nettoyage du timeout
            clearTimeout(timeoutId);
            
            if (error instanceof DOMException && error.name === 'AbortError') {
              console.error(`SyncQueue: Tâche ${id} interrompue par timeout`);
              reject(new Error(`Timeout lors de l'exécution de la tâche ${id}`));
            } else {
              console.error(`SyncQueue: Erreur lors de l'exécution de la tâche ${id}:`, error);
              reject(error);
            }
          }
        } finally {
          // Attendre un délai OBLIGATOIRE entre deux tâches
          await new Promise(r => setTimeout(r, 500));
          
          // Nettoyer les ressources
          this.abortControllers.delete(id);
          this.currentTask = null;
          this.lastProcessingTime = Date.now();
        }
      }
    } finally {
      // Libérer le verrou global et marquer le traitement comme terminé
      this.globalLock = false;
      this.processing = false;
      console.log(`SyncQueue: Traitement terminé, file d'attente vide`);
    }
  }
  
  /**
   * Déverrouiller le système et forcer le traitement de la file
   */
  public forceProcessQueue(): void {
    if (this.globalLock || this.processing) {
      console.log("SyncQueue: Forçage du traitement de la file d'attente");
      this.globalLock = false;
      this.processing = false;
      
      // Nettoyer toute tâche en cours
      if (this.currentTask) {
        const controller = this.abortControllers.get(this.currentTask.id);
        if (controller) {
          controller.abort();
          this.abortControllers.delete(this.currentTask.id);
        }
        this.currentTask = null;
      }
      
      // Si des tâches sont en attente, démarrer le traitement
      if (this.queue.length > 0) {
        this.processQueue().catch(error => {
          console.error("SyncQueue: Erreur lors du forçage du traitement:", error);
        });
      }
    }
  }

  /**
   * Vérifier si une table a des tâches en attente
   */
  public hasPendingTasks(tableName: string): boolean {
    // Vérifier la tâche en cours
    if (this.currentTask && this.currentTask.tableName === tableName) {
      return true;
    }

    // Vérifier les tâches en attente
    return this.queue.some(task => task.tableName === tableName);
  }

  /**
   * Annuler toutes les tâches en attente pour une table spécifique
   */
  public cancelPendingTasks(tableName: string): number {
    const initialLength = this.queue.length;
    
    // Filtrer les tâches à conserver
    this.queue = this.queue.filter(task => {
      if (task.tableName === tableName) {
        task.reject(new Error("Tâche annulée"));
        return false;
      }
      return true;
    });
    
    // Annuler la tâche en cours si elle correspond à la table
    if (this.currentTask && this.currentTask.tableName === tableName) {
      const controller = this.abortControllers.get(this.currentTask.id);
      if (controller) {
        controller.abort();
        this.abortControllers.delete(this.currentTask.id);
      }
      // La tâche sera automatiquement rejetée via le signal d'annulation
    }
    
    const canceledCount = initialLength - this.queue.length;
    if (canceledCount > 0) {
      console.log(`SyncQueue: ${canceledCount} tâches annulées pour ${tableName}`);
    }
    
    return canceledCount;
  }
  
  /**
   * Vérifier si la file d'attente est verrouillée
   */
  public isLocked(): boolean {
    return this.globalLock;
  }
  
  /**
   * Obtenir le nombre de tâches en attente
   */
  public getQueueLength(): number {
    return this.queue.length;
  }
  
  /**
   * Obtenir le statut actuel de la file d'attente
   */
  public getStatus(): {
    processing: boolean;
    locked: boolean;
    queueLength: number;
    currentTask: string | null;
  } {
    return {
      processing: this.processing,
      locked: this.globalLock,
      queueLength: this.queue.length,
      currentTask: this.currentTask ? `${this.currentTask.tableName} (${this.currentTask.id})` : null
    };
  }
}

// Instance singleton du gestionnaire de file d'attente
export const syncQueue = new SyncQueueManager();

// Exposer une fonction pour forcer le traitement
export const forceSyncQueueProcessing = (): void => {
  syncQueue.forceProcessQueue();
};
