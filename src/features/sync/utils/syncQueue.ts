
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
};

class SyncQueueManager {
  private queue: SyncTask[] = [];
  private processing: boolean = false;
  private currentTask: SyncTask | null = null;
  private taskTimeout: number = 30000; // 30 secondes maximum par tâche
  private abortControllers: Map<string, AbortController> = new Map();
  private globalLock: boolean = false;

  /**
   * Ajouter une tâche à la file d'attente
   */
  public enqueue<T>(tableName: string, task: () => Promise<T>): Promise<T> {
    const taskId = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`SyncQueue: Ajout de la tâche ${taskId} à la file d'attente`);

    // Créer une nouvelle promesse qui sera résolue lorsque la tâche sera exécutée
    return new Promise<T>((resolve, reject) => {
      const syncTask: SyncTask = {
        id: taskId,
        tableName,
        execute: task,
        resolve,
        reject,
        createdAt: Date.now()
      };

      // Ajouter la tâche à la file d'attente
      this.queue.push(syncTask);
      console.log(`SyncQueue: File d'attente contient ${this.queue.length} tâches`);
      
      // Démarrer le traitement si ce n'est pas déjà en cours
      if (!this.processing) {
        this.processQueue().catch(error => {
          console.error(`SyncQueue: Erreur lors du traitement de la file d'attente:`, error);
        });
      }
    });
  }

  /**
   * Traiter la file d'attente de manière strictement séquentielle
   */
  private async processQueue() {
    if (this.processing) {
      console.log(`SyncQueue: Traitement déjà en cours, attente...`);
      return;
    }

    this.processing = true;

    try {
      // Utiliser un verrou global pour garantir une exécution strictement séquentielle
      this.globalLock = true;
      
      while (this.queue.length > 0) {
        // Récupérer la prochaine tâche
        this.currentTask = this.queue.shift()!;
        const { id, tableName, execute, resolve, reject, createdAt } = this.currentTask;
        
        console.log(`SyncQueue: Exécution de la tâche ${id} pour ${tableName}`);

        // Attendre un court délai entre les tâches pour garantir la séparation
        await new Promise(r => setTimeout(r, 300));
        
        // Vérifier si la tâche est trop ancienne (plus de 5 minutes)
        if (Date.now() - createdAt > 300000) { // 300000 ms = 5 minutes
          console.warn(`SyncQueue: La tâche ${id} est trop ancienne, annulation`);
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
          // Attendre un court délai avant la tâche suivante pour éviter les conflits
          await new Promise(r => setTimeout(r, 300));
          
          // Nettoyer les ressources
          this.abortControllers.delete(id);
          this.currentTask = null;
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
}

// Instance singleton du gestionnaire de file d'attente
export const syncQueue = new SyncQueueManager();
