
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Type pour représenter un tableau de données génériques
export type DataTable<T> = {
  tableName: string;
  data: T[];
  groups?: any[];
};

// Type pour connaître le résultat d'une synchronisation
export type SyncResult = {
  success: boolean;
  message: string;
  count?: number;
};

/**
 * Service centralisé pour synchroniser les données avec le serveur
 */
export class SyncService {
  private static instance: SyncService;
  private lastSynced: Record<string, Date> = {};
  private syncQueue: Set<string> = new Set();
  private isSyncing: boolean = false;
  private syncPromises: Record<string, Promise<SyncResult>> = {};
  private resolvers: Record<string, (value: SyncResult) => void> = {};
  private rejecters: Record<string, (reason?: any) => void> = {};
  
  private constructor() {
    // Singleton pattern
  }
  
  /**
   * Obtient l'instance unique du service de synchronisation
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }
  
  /**
   * Extrait un identifiant utilisateur valide pour les requêtes
   */
  private extractValidUserId(userId: any): string {
    // Si l'utilisateur n'est pas spécifié, utiliser l'utilisateur courant
    if (userId === undefined || userId === null) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        userId = currentUser;
      } else {
        console.warn("Aucun utilisateur spécifié ou connecté, utilisation de l'ID par défaut");
        return 'p71x6d_system';
      }
    }
    
    // Si c'est déjà une chaîne, la retourner directement
    if (typeof userId === 'string') {
      return userId;
    }
    
    // Si c'est un objet, essayer d'extraire un identifiant
    if (typeof userId === 'object' && userId !== null) {
      // Propriétés potentielles pour extraire un ID
      const idProperties = ['identifiant_technique', 'email', 'id'];
      
      for (const prop of idProperties) {
        if (userId[prop] && typeof userId[prop] === 'string') {
          return userId[prop];
        }
      }
    }
    
    // Valeur par défaut si aucun identifiant valide n'a été trouvé
    console.warn(`Impossible d'extraire un ID valide, utilisation de l'ID système`);
    return 'p71x6d_system';
  }
  
  /**
   * Vérifie si une table est en cours de synchronisation
   * @param tableName Nom de la table
   */
  public isSyncingTable(tableName: string): boolean {
    return this.syncQueue.has(tableName);
  }
  
  /**
   * Obtient la dernière date de synchronisation pour une table
   * @param tableName Nom de la table
   */
  public getLastSynced(tableName: string): Date | null {
    return this.lastSynced[tableName] || null;
  }
  
  /**
   * Synchronise une table avec le serveur
   * @param table Table à synchroniser
   * @param userId ID de l'utilisateur (optionnel)
   */
  public syncTable<T>(table: DataTable<T>, userId?: any): Promise<SyncResult> {
    const { tableName, data, groups } = table;
    
    // Si la table est déjà en synchronisation, renvoyer la promesse existante
    if (this.syncQueue.has(tableName)) {
      console.log(`La table ${tableName} est déjà en cours de synchronisation`);
      return this.syncPromises[tableName];
    }
    
    // Créer une nouvelle promesse pour cette synchronisation
    this.syncPromises[tableName] = new Promise<SyncResult>((resolve, reject) => {
      this.resolvers[tableName] = resolve;
      this.rejecters[tableName] = reject;
    });
    
    // Ajouter la table à la file d'attente
    this.syncQueue.add(tableName);
    
    // Si aucune synchronisation n'est en cours, démarrer le processus
    if (!this.isSyncing) {
      this.processQueue();
    }
    
    return this.syncPromises[tableName];
  }
  
  /**
   * Traite la file d'attente de synchronisation
   */
  private async processQueue(): Promise<void> {
    // Si la file d'attente est vide, terminer le processus
    if (this.syncQueue.size === 0) {
      this.isSyncing = false;
      return;
    }
    
    this.isSyncing = true;
    
    // Récupérer la première table de la file d'attente
    const tableName = Array.from(this.syncQueue)[0];
    
    try {
      const result = await this.performSync(tableName);
      
      // Mettre à jour la dernière date de synchronisation
      this.lastSynced[tableName] = new Date();
      
      // Résoudre la promesse
      if (this.resolvers[tableName]) {
        this.resolvers[tableName](result);
        delete this.resolvers[tableName];
        delete this.rejecters[tableName];
      }
    } catch (error) {
      // En cas d'erreur, rejeter la promesse
      if (this.rejecters[tableName]) {
        this.rejecters[tableName](error);
        delete this.resolvers[tableName];
        delete this.rejecters[tableName];
      }
    } finally {
      // Supprimer la table de la file d'attente
      this.syncQueue.delete(tableName);
      delete this.syncPromises[tableName];
      
      // Traiter la table suivante
      this.processQueue();
    }
  }
  
  /**
   * Effectue la synchronisation avec le serveur
   * @param tableName Nom de la table
   */
  private async performSync(tableName: string): Promise<SyncResult> {
    const API_URL = getApiUrl();
    
    // Construire l'URL de l'endpoint de synchronisation
    const endpoint = `${API_URL}/${tableName}-sync.php`;
    
    console.log(`Synchronisation de ${tableName} vers ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.extractValidUserId(getCurrentUser()),
          [tableName]: []  // Données à synchroniser
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Échec de la synchronisation");
      }
      
      return {
        success: true,
        message: result.message || "Synchronisation réussie",
        count: result.count
      };
      
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  }
}

// Export d'une instance singleton
export const syncService = SyncService.getInstance();
