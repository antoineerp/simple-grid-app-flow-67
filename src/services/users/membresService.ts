
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { saveLocalData, loadLocalData } from '@/features/sync/utils/syncStorageManager';
import { getCurrentUserId } from '@/services/core/userService';
import { validateJsonResponse, extractValidJson } from '@/utils/jsonValidator';

// Cache pour les membres
let membresCache: Membre[] | null = null;
let lastFetchTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute de cache

/**
 * Service pour la gestion des membres (ressources humaines)
 * Version optimisée avec gestion d'identifiant d'appareil et synchronisation améliorée
 */
export const getMembres = async (forceRefresh: boolean = false): Promise<Membre[]> => {
  const userId = getCurrentUserId();
  
  // Générer un identifiant unique pour cet appareil s'il n'existe pas
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
    console.log("Nouvel identifiant d'appareil généré:", deviceId);
  }
  
  // Vérifier si une synchronisation est nécessaire en se basant sur la dernière synchronisation distante
  const lastServerSync = localStorage.getItem(`lastServerSync_membres_${userId}`);
  const now = Date.now();
  let shouldFetchFromServer = forceRefresh;
  
  if (!lastServerSync || (now - parseInt(lastServerSync, 10) > 120000)) { // 2 minutes entre les sync forcées
    shouldFetchFromServer = true;
  }
  
  // Retourner les données du cache si disponibles et pas encore expirées
  if (!shouldFetchFromServer && !forceRefresh && membresCache && lastFetchTimestamp && 
     (Date.now() - lastFetchTimestamp < CACHE_DURATION)) {
    console.log("Utilisation du cache pour les membres", membresCache.length);
    return membresCache;
  }

  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      console.error("Tentative de récupération des membres sans authentification");
      const localData = getLocalMembres();
      return localData && Array.isArray(localData) ? localData : [];
    }

    const API_URL = getApiUrl();
    if (!API_URL) {
      console.error("URL de l'API non configurée");
      const localData = getLocalMembres();
      return localData && Array.isArray(localData) ? localData : [];
    }

    console.log(`Chargement des membres pour l'utilisateur: ${userId}`);

    // Génération d'un timestamp pour éviter le cache du navigateur
    const timestamp = new Date().getTime();
    
    const response = await fetch(`${API_URL}/membres-load.php?userId=${userId}&_t=${timestamp}&deviceId=${deviceId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log("Réponse brute de membres-load.php:", responseText.substring(0, 200));
    
    // Utiliser notre utilitaire pour valider et analyser la réponse JSON
    const { isValid, data, error } = validateJsonResponse(responseText);
    
    if (!isValid) {
      console.error("Réponse invalide du serveur:", error);
      console.error("Aperçu de la réponse:", responseText.substring(0, 500));
      
      // Tenter d'extraire une partie JSON valide
      const { extracted, data: extractedData } = extractValidJson(responseText);
      if (extracted && extractedData) {
        console.log("JSON extrait avec succès de la réponse corrompue");
        membresCache = Array.isArray(extractedData) ? extractedData : 
                     (extractedData.records && Array.isArray(extractedData.records) ? extractedData.records : []);
        lastFetchTimestamp = Date.now();
        saveLocalData('membres', membresCache, userId);
        return membresCache;
      }
      
      throw new Error(`Réponse invalide du serveur: ${error}`);
    }
    
    // Si les données sont vides, retourner un tableau vide
    if (!data) {
      return [];
    }
    
    // Déterminer où se trouvent les données dans la réponse
    let records: Membre[] = [];
    
    if (Array.isArray(data)) {
      records = data;
    } else if (data.records && Array.isArray(data.records)) {
      records = data.records;
    } else if (data.membres && Array.isArray(data.membres)) {
      records = data.membres;
    } else if (data.data && Array.isArray(data.data)) {
      records = data.data;
    } else {
      console.warn("Format de réponse non reconnu pour les membres");
      records = [];
    }

    // Ajouter le champ userId s'il est manquant
    records = records.map(membre => ({
      ...membre,
      userId: membre.userId || userId
    }));

    // Mettre à jour le cache
    membresCache = records;
    lastFetchTimestamp = Date.now();
    
    // Sauvegarder en local également avec le nouveau système unifié
    saveLocalData('membres', records, userId);
    
    // Enregistrer l'horodatage de la dernière synchronisation serveur
    localStorage.setItem(`lastServerSync_membres_${userId}`, Date.now().toString());
    
    return records;
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    
    // Essayer de récupérer depuis le stockage local avec le nouveau système
    try {
      const localMembres = loadLocalData<Membre>('membres', userId);
      if (localMembres && Array.isArray(localMembres) && localMembres.length > 0) {
        console.log("Utilisation des membres du stockage local unifié:", localMembres.length);
        return localMembres;
      }
    } catch (localError) {
      console.error("Erreur lors du chargement des données locales unifiées:", localError);
    }
    
    // Si rien dans le système unifié, essayer l'ancien système
    const oldLocalData = getLocalMembres();
    return oldLocalData && Array.isArray(oldLocalData) ? oldLocalData : [];
  }
};

/**
 * Récupère les membres depuis le stockage local (ancien système)
 * Conservé pour compatibilité
 */
const getLocalMembres = (): Membre[] | null => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn("Aucun ID utilisateur disponible pour charger les données locales");
      return [];
    }
    
    const localData = localStorage.getItem(`membres_${userId}`);
    
    if (localData) {
      const parsedData = JSON.parse(localData);
      console.log("Utilisation des données locales pour les membres (ancien système)");
      return Array.isArray(parsedData) ? parsedData : [];
    }
  } catch (localError) {
    console.error("Erreur lors de la lecture des données locales des membres:", localError);
  }
  
  return [];
};

/**
 * Synchronise les membres avec le serveur
 */
export const syncMembres = async (membres?: Membre[]): Promise<boolean> => {
  try {
    // Valider l'entrée
    if (membres !== undefined && !Array.isArray(membres)) {
      console.error("syncMembres: L'argument membres n'est pas un tableau valide", typeof membres);
      return false;
    }
    
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      console.error("Utilisateur non authentifié pour la synchronisation des membres");
      throw new Error("Utilisateur non authentifié");
    }

    const API_URL = getApiUrl();
    if (!API_URL) {
      console.error("URL de l'API non configurée pour la synchronisation des membres");
      return false;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("ID utilisateur non disponible pour la synchronisation");
      return false;
    }
    
    const deviceId = localStorage.getItem('deviceId') || 'unknown';

    // Si aucune liste de membres n'est fournie, utiliser les données du cache ou le stockage local
    let membresToSync: Membre[] = [];
    
    if (Array.isArray(membres) && membres.length > 0) {
      membresToSync = membres;
    } else if (membresCache && Array.isArray(membresCache)) {
      membresToSync = membresCache;
    } else {
      try {
        const localData = loadLocalData<Membre>('membres', userId);
        if (Array.isArray(localData) && localData.length > 0) {
          membresToSync = localData;
        } else {
          // Dernier recours: ancien système de stockage
          const oldData = getLocalMembres();
          if (Array.isArray(oldData) && oldData.length > 0) {
            membresToSync = oldData;
          } else {
            // Initialiser un tableau vide si toutes les autres options échouent
            membresToSync = [];
          }
        }
      } catch (e) {
        console.error("Erreur lors du chargement des données locales pour la synchronisation:", e);
        membresToSync = [];
      }
    }
    
    console.log(`Synchronisation de ${membresToSync.length} membres pour l'utilisateur ${userId}`);
    
    // Assurer que chaque membre a un userId
    const membresWithUserId = membresToSync.map(membre => ({
      ...membre,
      userId: membre.userId || userId
    }));

    const response = await fetch(`${API_URL}/membres-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'  // Spécifier que nous attendons du JSON
      },
      body: JSON.stringify({
        userId,
        deviceId,
        membres: membresWithUserId
      })
    });

    // Si la réponse n'est pas OK, obtenir le texte d'erreur
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      
      // Vérifier si l'erreur contient du HTML (ce qui pourrait indiquer un problème côté serveur)
      if (errorText.indexOf('<') !== -1) {
        console.error("La réponse contient du HTML au lieu de JSON:", errorText.substring(0, 200));
        throw new Error(`Le serveur a renvoyé une page HTML au lieu de JSON (statut: ${response.status})`);
      }
      
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    // Récupérer le texte brut pour pouvoir le diagnostiquer
    const responseText = await response.text();
    console.log("Réponse brute de membres-sync.php:", responseText.substring(0, 200));
    
    // Utiliser notre utilitaire pour valider et analyser la réponse JSON
    const { isValid, data: result, error } = validateJsonResponse(responseText);
    
    if (!isValid) {
      console.error("Réponse invalide du serveur lors de la synchronisation:", error);
      console.error("Aperçu de la réponse:", responseText.substring(0, 500));
      
      // Tenter d'extraire une partie JSON valide
      const { extracted, data: extractedData } = extractValidJson(responseText);
      if (extracted && extractedData && extractedData.success) {
        console.log("JSON extrait avec succès de la réponse corrompue");
        
        // Mettre à jour le cache
        membresCache = membresWithUserId;
        lastFetchTimestamp = Date.now();
        
        // Sauvegarde locale avec le système unifié
        saveLocalData('membres', membresWithUserId, userId);
        
        // Enregistrer l'horodatage de la dernière synchronisation
        localStorage.setItem(`lastServerSync_membres_${userId}`, Date.now().toString());
        
        // Notifier le succès de la synchronisation - important pour la cohérence cross-device
        dispatchSyncEvent('membres', 'sync', true);
        
        return true;
      }
      
      throw new Error(`Réponse invalide du serveur: ${error}`);
    }
    
    if (result.success) {
      // Mise à jour du cache
      membresCache = membresWithUserId;
      lastFetchTimestamp = Date.now();
      
      // Sauvegarde locale avec le système unifié
      saveLocalData('membres', membresWithUserId, userId);
      
      // Enregistrer l'horodatage de la dernière synchronisation
      localStorage.setItem(`lastServerSync_membres_${userId}`, Date.now().toString());
      
      // Notifier le succès de la synchronisation - important pour la cohérence cross-device
      dispatchSyncEvent('membres', 'sync', true);
      
      return true;
    } else {
      throw new Error(result.message || "Échec de la synchronisation");
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation des membres:", error);
    // Notifier l'échec de la synchronisation
    dispatchSyncEvent('membres', 'sync', false, error instanceof Error ? error.message : String(error));
    return false;
  }
};

// Déclencher un événement de synchronisation pour informer d'autres composants
const dispatchSyncEvent = (tableName: string, operation: 'load' | 'sync', success: boolean, errorMessage?: string): void => {
  const eventName = success ? 'syncCompleted' : 'syncFailed';
  const detail = {
    tableName,
    operation,
    success,
    timestamp: new Date().toISOString(),
    error: errorMessage
  };
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
};

export const clearMembresCache = (): void => {
  membresCache = null;
  lastFetchTimestamp = null;
  console.log("Cache membres effacé");
};
