
/**
 * Gestionnaire de file d'attente pour les opérations de synchronisation
 * Assure que les opérations se déroulent de manière séquentielle
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
        this.processQueue();
      }
    });
  }

  /**
   * Traiter la file d'attente de manière séquentielle
   */
  private async processQueue() {
    if (this.processing) {
      console.log(`SyncQueue: Traitement déjà en cours, attente...`);
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        // Récupérer la prochaine tâche
        this.currentTask = this.queue.shift()!;
        const { id, tableName, execute, resolve, reject, createdAt } = this.currentTask;
        
        console.log(`SyncQueue: Exécution de la tâche ${id} pour ${tableName}`);

        // Vérifier si la tâche est trop ancienne (plus de 5 minutes)
        if (Date.now() - createdAt > 300000) {
          console.warn(`SyncQueue: La tâche ${id} est trop ancienne, annulation`);
          reject(new Error("La tâche a expiré"));
          continue;
        }

        // Créer un timeout pour éviter les tâches bloquantes
        const timeoutPromise = new Promise((_, timeoutReject) => {
          setTimeout(() => {
            timeoutReject(new Error(`SyncQueue: Timeout lors de l'exécution de la tâche ${id}`));
          }, this.taskTimeout);
        });

        try {
          // Exécuter la tâche avec un timeout
          const result = await Promise.race([
            execute(),
            timeoutPromise
          ]);
          
          console.log(`SyncQueue: Tâche ${id} terminée avec succès`);
          resolve(result);
        } catch (error) {
          console.error(`SyncQueue: Erreur lors de l'exécution de la tâche ${id}:`, error);
          reject(error);
        } finally {
          this.currentTask = null;
        }
      }
    } finally {
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
    
    const canceledCount = initialLength - this.queue.length;
    if (canceledCount > 0) {
      console.log(`SyncQueue: ${canceledCount} tâches annulées pour ${tableName}`);
    }
    
    return canceledCount;
  }
}

// Instance singleton du gestionnaire de file d'attente
export const syncQueue = new SyncQueueManager();

