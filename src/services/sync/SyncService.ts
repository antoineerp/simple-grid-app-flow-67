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
  private syncTriggers: Record<string, "auto" | "manual" | "initial"> = {};
  
  private constructor() {
    // Singleton pattern
    console.log('Service de synchronisation initialisé');
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
   * Obtient le déclencheur de la dernière synchronisation pour une table
   * @param tableName Nom de la table
   */
  public getSyncTrigger(tableName: string): "auto" | "manual" | "initial" | null {
    return this.syncTriggers[tableName] || null;
  }
  
  /**
   * Synchronise une table avec le serveur
   * @param table Table à synchroniser
   * @param userId ID de l'utilisateur (optionnel)
   * @param trigger Type de déclenchement de la synchronisation
   */
  public syncTable<T>(
    table: DataTable<T>, 
    userId?: any, 
    trigger: "auto" | "manual" | "initial" = "auto"
  ): Promise<SyncResult> {
    const { tableName, data, groups } = table;
    
    // Enregistrer le type de déclencheur
    this.syncTriggers[tableName] = trigger;
    
    console.log(`Synchronisation ${trigger} de ${tableName} demandée`);
    
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
      // Avant de synchroniser, vérifier si la structure de la table est valide
      try {
        // Import dynamique du helper de base de données pour éviter les dépendances circulaires
        const { databaseHelper } = await import('./DatabaseHelper');
        const isValid = await databaseHelper.validateTable(tableName);
        
        if (!isValid) {
          console.warn(`La structure de la table ${tableName} n'est pas valide, tentative de synchronisation quand même`);
        }
      } catch (validationError) {
        console.error("Erreur lors de la validation de la structure:", validationError);
        // Continuer malgré l'erreur de validation
      }
      
      // Effectuer la requête de synchronisation
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
        // En cas d'erreur, essayer une URL alternative (infomaniak)
        const alternativeEndpoint = `/sites/qualiopi.ch/api/${tableName}-sync.php`;
        console.log(`Tentative avec URL alternative: ${alternativeEndpoint}`);
        
        const alternativeResponse = await fetch(alternativeEndpoint, {
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
        
        if (!alternativeResponse.ok) {
          const errorText = await alternativeResponse.text();
          throw new Error(`Erreur ${alternativeResponse.status}: ${errorText}`);
        }
        
        const alternativeResult = await alternativeResponse.json();
        
        if (!alternativeResult.success) {
          throw new Error(alternativeResult.message || "Échec de la synchronisation");
        }
        
        return {
          success: true,
          message: alternativeResult.message || "Synchronisation réussie (URL alternative)",
          count: alternativeResult.count
        };
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
      
      // Sauvegarde locale comme solution de secours
      localStorage.setItem(`sync_failed_${tableName}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }));
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  }
  
  /**
   * Obtenir un résumé de l'état de synchronisation
   */
  public getSyncStatus(): {
    activeSyncs: string[];
    lastSynced: Record<string, Date | null>;
    queueSize: number;
    isSyncing: boolean;
  } {
    return {
      activeSyncs: Array.from(this.syncQueue),
      lastSynced: { ...this.lastSynced },
      queueSize: this.syncQueue.size,
      isSyncing: this.isSyncing
    };
  }
  
  /**
   * Charge des données depuis le serveur
   * @param tableName Nom de la table à charger
   * @param userId ID utilisateur
   */
  public async loadDataFromServer<T>(tableName: string, userId?: any): Promise<T[]> {
    const API_URL = getApiUrl();
    const currentUser = this.extractValidUserId(userId);
    
    console.log(`Chargement des données de ${tableName} pour l'utilisateur ${currentUser}`);
    
    // Essayer de charger depuis l'URL principale
    let response;
    
    try {
      response = await fetch(`${API_URL}/${tableName}-load.php?userId=${currentUser}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
    } catch (err) {
      // En cas d'erreur, essayer l'URL alternative
      console.warn(`Erreur lors du chargement depuis l'URL principale: ${err}`);
      
      try {
        const alternativeUrl = `/sites/qualiopi.ch/api/${tableName}-load.php`;
        console.log(`Tentative avec URL alternative: ${alternativeUrl}`);
        
        response = await fetch(`${alternativeUrl}?userId=${currentUser}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
      } catch (err2) {
        console.error(`Échec également avec l'URL alternative: ${err2}`);
        
        // Retourner les données locales si disponibles
        const localData = localStorage.getItem(`${tableName}_${currentUser}`);
        if (localData) {
          try {
            return JSON.parse(localData);
          } catch (e) {
            console.error(`Erreur lors de la lecture des données locales: ${e}`);
          }
        }
        
        throw new Error(`Impossible de charger les données: ${err}`);
      }
    }
    
    if (!response.ok) {
      // Si la réponse n'est pas ok, essayer de retourner les données locales
      const localData = localStorage.getItem(`${tableName}_${currentUser}`);
      if (localData) {
        try {
          return JSON.parse(localData);
        } catch (e) {
          console.error(`Erreur lors de la lecture des données locales: ${e}`);
        }
      }
      
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Mettre à jour la date de dernière synchronisation
    this.lastSynced[tableName] = new Date();
    
    // Traiter les différents formats de réponse possibles
    if (data && data.data && data.data.records && Array.isArray(data.data.records)) {
      return data.data.records;
    } else if (data && data.records && Array.isArray(data.records)) {
      return data.records;
    } else if (data && data.documents && Array.isArray(data.documents)) {
      return data.documents;
    } else if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    }
    
    // Si on ne peut pas déterminer le format, retourner un tableau vide
    console.warn(`Format de données inattendu reçu du serveur:`, data);
    return [];
  }
}

// Export d'une instance singleton
export const syncService = SyncService.getInstance();
