
import { triggerSync, triggerSyncAll } from './index';
import { getCurrentUserId } from '../core/userService';

/**
 * Service de synchronisation global pour l'application
 */
class GlobalSyncManager {
  private static instance: GlobalSyncManager;
  private syncInterval: number = 10000; // 10 seconds by default
  private timer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private lastSynced: Date | null = null;
  
  private constructor() {
    // Singleton pattern
    console.log('GlobalSyncManager: Initialisation du service de synchronisation global');
  }
  
  public static getInstance(): GlobalSyncManager {
    if (!GlobalSyncManager.instance) {
      GlobalSyncManager.instance = new GlobalSyncManager();
    }
    return GlobalSyncManager.instance;
  }
  
  /**
   * Démarre le service de synchronisation
   */
  public start(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = setInterval(() => {
      this.performGlobalSync();
    }, this.syncInterval);
    
    console.log(`GlobalSyncManager: Service démarré (intervalle: ${this.syncInterval / 1000}s)`);
    
    // Effectuer une première synchronisation immédiate
    this.performGlobalSync();
  }
  
  /**
   * Arrête le service de synchronisation
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('GlobalSyncManager: Service arrêté');
    }
  }
  
  /**
   * Définit l'intervalle de synchronisation
   * @param seconds Intervalle en secondes
   */
  public setSyncInterval(seconds: number): void {
    if (seconds < 1) {
      console.warn('GlobalSyncManager: Intervalle minimum est de 1 seconde');
      seconds = 1;
    }
    
    this.syncInterval = seconds * 1000;
    console.log(`GlobalSyncManager: Intervalle défini à ${seconds}s`);
    
    // Redémarrer le service avec le nouvel intervalle
    if (this.timer) {
      this.start();
    }
  }
  
  /**
   * Effectue une synchronisation globale
   */
  private async performGlobalSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('GlobalSyncManager: Synchronisation déjà en cours, ignoré');
      return;
    }
    
    this.isSyncing = true;
    
    try {
      console.log('GlobalSyncManager: Début de la synchronisation globale');
      
      // Synchroniser les tables principales
      const tables = ['membres', 'documents', 'exigences', 'bibliotheque'];
      
      for (const table of tables) {
        try {
          await triggerSync(table);
        } catch (error) {
          console.error(`GlobalSyncManager: Erreur lors de la synchronisation de ${table}:`, error);
        }
      }
      
      this.lastSynced = new Date();
      console.log('GlobalSyncManager: Synchronisation globale terminée');
    } catch (error) {
      console.error('GlobalSyncManager: Erreur globale de synchronisation:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Force une synchronisation immédiate
   */
  public async forceSyncNow(): Promise<void> {
    await this.performGlobalSync();
  }
  
  /**
   * Obtient la dernière date de synchronisation
   */
  public getLastSyncDate(): Date | null {
    return this.lastSynced;
  }
  
  /**
   * Vérifie si une synchronisation est en cours
   */
  public isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}

// Exporter l'instance unique
export const globalSyncManager = GlobalSyncManager.getInstance();

// Démarrer automatiquement le service
if (typeof window !== 'undefined') {
  setTimeout(() => {
    globalSyncManager.start();
  }, 1000); // Petit délai pour s'assurer que l'application est chargée
}
