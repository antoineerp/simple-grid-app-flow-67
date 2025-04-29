
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
  
  // Table de correspondance pour gérer le renommage de "bibliotheque" à "collaboration"
  private tableMapping: Record<string, string> = {
    'bibliotheque': 'collaboration'
  };
  
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
    // Vérifier le mappage de la table
    const actualTableName = this.getMappedTableName(tableName);
    return this.syncQueue.has(actualTableName);
  }
  
  /**
   * Obtient la dernière date de synchronisation pour une table
   * @param tableName Nom de la table
   */
  public getLastSynced(tableName: string): Date | null {
    // Vérifier le mappage de la table
    const actualTableName = this.getMappedTableName(tableName);
    return this.lastSynced[actualTableName] || null;
  }
  
  /**
   * Obtient le déclencheur de la dernière synchronisation pour une table
   * @param tableName Nom de la table
   */
  public getSyncTrigger(tableName: string): "auto" | "manual" | "initial" | null {
    // Vérifier le mappage de la table
    const actualTableName = this.getMappedTableName(tableName);
    return this.syncTriggers[actualTableName] || null;
  }
  
  /**
   * Applique le mappage de table pour gérer la transition de noms
   * @param tableName Nom original de la table
   * @returns Nom mappé de la table (ou original si pas de mappage)
   */
  private getMappedTableName(tableName: string): string {
    return this.tableMapping[tableName] || tableName;
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
    // Appliquer le mappage de table
    const actualTableName = this.getMappedTableName(tableName);
    
    // Enregistrer le type de déclencheur
    this.syncTriggers[actualTableName] = trigger;
    
    console.log(`Synchronisation ${trigger} de ${actualTableName} (original: ${tableName}) demandée avec ${data?.length || 0} éléments`);
    
    // Si la table est déjà en synchronisation, renvoyer la promesse existante
    if (this.syncQueue.has(actualTableName)) {
      console.log(`La table ${actualTableName} est déjà en cours de synchronisation`);
      return this.syncPromises[actualTableName];
    }
    
    // Stocker les données à synchroniser dans le localStorage pour les récupérer plus tard
    this.storeDataToSync(actualTableName, data);
    
    // Récupérer l'ID utilisateur valide
    const validUserId = this.extractValidUserId(userId);
    
    // Créer une nouvelle promesse pour cette synchronisation
    this.syncPromises[actualTableName] = new Promise<SyncResult>((resolve, reject) => {
      this.resolvers[actualTableName] = resolve;
      this.rejecters[actualTableName] = reject;
      
      // Exécuter la synchronisation immédiatement
      this.performSync(actualTableName, data, validUserId)
        .then((result) => {
          // Mettre à jour la dernière date de synchronisation
          this.lastSynced[actualTableName] = new Date();
          
          // Informer du succès
          if (this.resolvers[actualTableName]) {
            this.resolvers[actualTableName](result);
            delete this.resolvers[actualTableName];
            delete this.rejecters[actualTableName];
          }
          
          // Supprimer de la file d'attente
          this.syncQueue.delete(actualTableName);
          delete this.syncPromises[actualTableName];
        })
        .catch((error) => {
          // En cas d'erreur
          if (this.rejecters[actualTableName]) {
            this.rejecters[actualTableName](error);
            delete this.resolvers[actualTableName];
            delete this.rejecters[actualTableName];
          }
          
          // Supprimer de la file d'attente
          this.syncQueue.delete(actualTableName);
          delete this.syncPromises[actualTableName];
        });
    });
    
    // Ajouter la table à la file d'attente
    this.syncQueue.add(actualTableName);
    
    return this.syncPromises[actualTableName];
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
      
      // Si c'est une ancienne table mappée, supprimer les données obsolètes
      Object.entries(this.tableMapping).forEach(([oldName, newName]) => {
        if (newName === tableName) {
          localStorage.removeItem(`pending_sync_${oldName}`);
          localStorage.removeItem(`${oldName}_${userId}`);
        }
      });
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
      
      // Si c'est une table mappée, vérifier aussi l'ancienne clé
      Object.entries(this.tableMapping).forEach(([oldName, newName]) => {
        if (newName === tableName) {
          const oldGroupsKey = `${oldName}_groups_${userId}`;
          const oldGroupsData = localStorage.getItem(oldGroupsKey);
          
          if (oldGroupsData) {
            try {
              const parsedGroups = JSON.parse(oldGroupsData);
              if (Array.isArray(parsedGroups)) {
                // Copier vers la nouvelle clé pour la prochaine fois
                localStorage.setItem(groupsKey, oldGroupsData);
                // Supprimer l'ancienne clé
                localStorage.removeItem(oldGroupsKey);
                return parsedGroups;
              }
            } catch (e) {
              console.error(`Erreur lors de la lecture des anciens groupes pour ${oldName}:`, e);
            }
          }
        }
      });
      
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
    // Appliquer le mappage de table
    const actualTableName = this.getMappedTableName(tableName);
    
    const API_URL = getApiUrl();
    const currentUser = this.extractValidUserId(userId);
    
    console.log(`Chargement des données de ${actualTableName} (original: ${tableName}) pour l'utilisateur ${currentUser}`);
    
    // Essayer de charger depuis l'URL principale
    let response;
    
    try {
      response = await fetch(`${API_URL}/${actualTableName}-load.php?userId=${currentUser}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
    } catch (err) {
      // En cas d'erreur, essayer l'URL alternative
      console.warn(`Erreur lors du chargement depuis l'URL principale: ${err}`);
      
      try {
        const alternativeUrl = `/sites/qualiopi.ch/api/${actualTableName}-load.php`;
        console.log(`Tentative avec URL alternative: ${alternativeUrl}`);
        
        response = await fetch(`${alternativeUrl}?userId=${currentUser}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
      } catch (err2) {
        console.error(`Échec également avec l'URL alternative: ${err2}`);
        
        // Retourner les données locales si disponibles
        const localData = localStorage.getItem(`${actualTableName}_${currentUser}`);
        if (localData) {
          try {
            return JSON.parse(localData);
          } catch (e) {
            console.error(`Erreur lors de la lecture des données locales: ${e}`);
          }
        }
        
        // Vérifier l'ancien nom de table aussi
        Object.entries(this.tableMapping).forEach(([oldName, newName]) => {
          if (newName === actualTableName) {
            const oldLocalData = localStorage.getItem(`${oldName}_${currentUser}`);
            if (oldLocalData) {
              try {
                const data = JSON.parse(oldLocalData);
                // Migrer vers le nouveau nom
                localStorage.setItem(`${actualTableName}_${currentUser}`, oldLocalData);
                localStorage.removeItem(`${oldName}_${currentUser}`);
                return data;
              } catch (e) {
                console.error(`Erreur lors de la lecture des anciennes données locales: ${e}`);
              }
            }
          }
        });
        
        throw new Error(`Impossible de charger les données: ${err}`);
      }
    }
    
    if (!response.ok) {
      // Si la réponse n'est pas ok, essayer de retourner les données locales
      const localData = localStorage.getItem(`${actualTableName}_${currentUser}`);
      if (localData) {
        try {
          return JSON.parse(localData);
        } catch (e) {
          console.error(`Erreur lors de la lecture des données locales: ${e}`);
        }
      }
      
      // Vérifier l'ancien nom de table aussi
      Object.entries(this.tableMapping).forEach(([oldName, newName]) => {
        if (newName === actualTableName) {
          const oldLocalData = localStorage.getItem(`${oldName}_${currentUser}`);
          if (oldLocalData) {
            try {
              const data = JSON.parse(oldLocalData);
              // Migrer vers le nouveau nom
              localStorage.setItem(`${actualTableName}_${currentUser}`, oldLocalData);
              localStorage.removeItem(`${oldName}_${currentUser}`);
              return data;
            } catch (e) {
              console.error(`Erreur lors de la lecture des anciennes données locales: ${e}`);
            }
          }
        }
      });
      
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Mettre à jour la date de dernière synchronisation
    this.lastSynced[actualTableName] = new Date();
    
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
