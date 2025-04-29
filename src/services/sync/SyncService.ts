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
   * @param tableName Nom de la table à synchroniser 
   * @param data Données à synchroniser
   * @param userId ID de l'utilisateur
   * @param trigger Type de déclenchement de la synchronisation
   */
  public syncTable<T>(
    tableName: string,
    data: T[],
    userId?: any,
    trigger: "auto" | "manual" | "initial" = "auto"
  ): Promise<SyncResult> {
    // Enregistrer le type de déclencheur
    this.syncTriggers[tableName] = trigger;
    
    console.log(`Synchronisation ${trigger} de ${tableName} demandée avec ${data?.length || 0} éléments`);
    console.log("Données à synchroniser:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Si la table est déjà en synchronisation, renvoyer la promesse existante
    if (this.syncQueue.has(tableName)) {
      console.log(`La table ${tableName} est déjà en cours de synchronisation`);
      return this.syncPromises[tableName];
    }
    
    // Stocker les données à synchroniser dans le localStorage pour les récupérer plus tard
    this.storeDataToSync(tableName, data);
    
    // Récupérer l'ID utilisateur valide
    const validUserId = this.extractValidUserId(userId);
    
    // Créer une nouvelle promesse pour cette synchronisation
    this.syncPromises[tableName] = new Promise<SyncResult>((resolve, reject) => {
      this.resolvers[tableName] = resolve;
      this.rejecters[tableName] = reject;
      
      // Exécuter la synchronisation immédiatement
      this.performSync(tableName, data, validUserId)
        .then((result) => {
          // Mettre à jour la dernière date de synchronisation
          this.lastSynced[tableName] = new Date();
          
          // Informer du succès
          if (this.resolvers[tableName]) {
            this.resolvers[tableName](result);
            delete this.resolvers[tableName];
            delete this.rejecters[tableName];
          }
          
          // Supprimer de la file d'attente
          this.syncQueue.delete(tableName);
          delete this.syncPromises[tableName];
        })
        .catch((error) => {
          // En cas d'erreur
          if (this.rejecters[tableName]) {
            this.rejecters[tableName](error);
            delete this.resolvers[tableName];
            delete this.rejecters[tableName];
          }
          
          // Supprimer de la file d'attente
          this.syncQueue.delete(tableName);
          delete this.syncPromises[tableName];
        });
    });
    
    // Ajouter la table à la file d'attente
    this.syncQueue.add(tableName);
    
    return this.syncPromises[tableName];
  }

  /**
   * Stocke les données à synchroniser
   */
  private storeDataToSync<T>(tableName: string, data: T[]): void {
    try {
      const userId = this.extractValidUserId(getCurrentUser());
      localStorage.setItem(`pending_sync_${tableName}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
      
      // Sauvegarder aussi dans le format spécifique à l'utilisateur
      localStorage.setItem(`${tableName}_${userId}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Erreur lors du stockage des données à synchroniser pour ${tableName}:`, e);
    }
  }

  /**
   * Effectue la synchronisation avec le serveur
   * @param tableName Nom de la table
   * @param data Données à synchroniser
   * @param userId ID utilisateur
   */
  private async performSync<T>(tableName: string, data: T[], userId: string): Promise<SyncResult> {
    const API_URL = getApiUrl();
    
    // Construire l'URL de l'endpoint de synchronisation
    const endpoint = `${API_URL}/${tableName}-sync.php`;
    
    console.log(`Synchronisation de ${tableName} vers ${endpoint}`);
    console.log(`Utilisateur: ${userId}`);
    
    try {
      // Récupérer les groupes à synchroniser si disponibles
      const groups = this.getGroupsToSync(tableName, userId);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn(`Aucune donnée à synchroniser pour ${tableName}`);
        // Retourner comme succès si aucune donnée à synchroniser
        return {
          success: true,
          message: `Aucune donnée à synchroniser pour ${tableName}`,
          count: 0
        };
      }
      
      // Effectuer la requête de synchronisation
      console.log(`Envoi de ${data.length} éléments pour synchronisation de ${tableName}`);
      
      const requestData: any = {
        userId: userId
      };
      
      // Utiliser le nom correct pour les propriétés de la requête
      // Par exemple 'bibliotheque', 'documents', etc.
      requestData[tableName] = data;
      
      // Ajouter la propriété 'groups' si disponible
      if (groups && Array.isArray(groups) && groups.length > 0) {
        requestData.groups = groups;
      }
      
      console.log("Données de requête:", JSON.stringify(requestData).substring(0, 200) + "...");
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      // Log pour déboguer la réponse HTTP
      console.log(`Réponse HTTP: ${response.status} ${response.statusText}`);
      
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
          body: JSON.stringify(requestData)
        });
        
        // Log pour déboguer la réponse HTTP alternative
        console.log(`Réponse HTTP alternative: ${alternativeResponse.status} ${alternativeResponse.statusText}`);
        
        if (!alternativeResponse.ok) {
          const errorText = await alternativeResponse.text();
          console.error(`Erreur de synchronisation alternative: ${errorText}`);
          throw new Error(`Erreur ${alternativeResponse.status}: ${errorText}`);
        }
        
        const alternativeResult = await alternativeResponse.json();
        console.log(`Résultat de la synchronisation alternative: ${JSON.stringify(alternativeResult)}`);
        
        if (!alternativeResult.success) {
          throw new Error(alternativeResult.message || "Échec de la synchronisation");
        }
        
        return {
          success: true,
          message: alternativeResult.message || "Synchronisation réussie (URL alternative)",
          count: alternativeResult.count || data.length
        };
      }
      
      // Obtenir le résultat de la requête principale
      const responseText = await response.text();
      console.log(`Réponse brute: ${responseText}`);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Erreur lors de l'analyse de la réponse JSON:", e);
        throw new Error(`Réponse invalide du serveur: ${responseText}`);
      }
      
      console.log(`Résultat de la synchronisation: ${JSON.stringify(result)}`);
      
      if (!result.success) {
        throw new Error(result.message || "Échec de la synchronisation");
      }
      
      // Enregistrer le résultat de la synchronisation dans localStorage
      this.storeLastSyncResult(tableName, {
        success: true,
        timestamp: new Date().toISOString(),
        count: result.count || data.length
      });
      
      return {
        success: true,
        message: result.message || "Synchronisation réussie",
        count: result.count || data.length
      };
      
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Sauvegarde locale comme solution de secours
      this.storeLastSyncResult(tableName, {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
      
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
   * Récupère les groupes à synchroniser pour une table
   */
  private getGroupsToSync(tableName: string, userId: string): any[] {
    try {
      // Vérifier dans le localStorage pour les groupes en attente
      const groupsKey = `${tableName}_groups_${userId}`;
      const groupsData = localStorage.getItem(groupsKey);
      
      if (groupsData) {
        try {
          const parsedGroups = JSON.parse(groupsData);
          if (Array.isArray(parsedGroups)) {
            return parsedGroups;
          }
        } catch (e) {
          console.error(`Erreur lors de la lecture des groupes pour ${tableName}:`, e);
        }
      }
      
      return [];
    } catch (e) {
      console.error(`Erreur lors de la récupération des groupes à synchroniser pour ${tableName}:`, e);
      return [];
    }
  }
  
  /**
   * Stocke le résultat de la dernière synchronisation
   */
  private storeLastSyncResult(tableName: string, result: any): void {
    try {
      localStorage.setItem(`last_sync_${tableName}`, JSON.stringify({
        ...result,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.error(`Erreur lors du stockage du résultat de synchronisation pour ${tableName}:`, e);
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
