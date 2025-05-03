
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

// Cache pour les membres
let membresCache: Membre[] | null = null;
let lastFetchTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute de cache

/**
 * Service pour la gestion des membres (ressources humaines)
 */
export const getMembres = async (forceRefresh: boolean = false): Promise<Membre[]> => {
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'p71x6d_system';
  const deviceId = localStorage.getItem('deviceId');
  
  // Générer un identifiant unique pour cet appareil s'il n'existe pas
  if (!deviceId) {
    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('deviceId', newDeviceId);
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
      return getLocalMembres() || [];
    }

    const API_URL = getApiUrl();
    console.log(`Chargement des membres pour l'utilisateur: ${userId}`);

    // Génération d'un timestamp pour éviter le cache du navigateur
    const timestamp = new Date().getTime();
    
    const response = await fetch(`${API_URL}/membres-load.php?userId=${userId}&_t=${timestamp}&deviceId=${localStorage.getItem('deviceId') || 'unknown'}`, {
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

    const data = await response.json();
    console.log("Réponse brute de membres-load.php:", data);
    
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
    
    // Sauvegarder en local également
    localStorage.setItem(`membres_${userId}`, JSON.stringify(records));
    
    // Enregistrer l'horodatage de la dernière synchronisation serveur
    localStorage.setItem(`lastServerSync_membres_${userId}`, Date.now().toString());
    
    return records;
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    
    // Essayer de récupérer depuis le stockage local
    return getLocalMembres() || [];
  }
};

/**
 * Récupère les membres depuis le stockage local
 */
const getLocalMembres = (): Membre[] | null => {
  try {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'p71x6d_system';
    const localData = localStorage.getItem(`membres_${userId}`);
    
    if (localData) {
      const parsedData = JSON.parse(localData);
      console.log("Utilisation des données locales pour les membres");
      return parsedData;
    }
  } catch (localError) {
    console.error("Erreur lors de la lecture des données locales des membres:", localError);
  }
  
  return null;
};

/**
 * Synchronise les membres avec le serveur
 */
export const syncMembres = async (membres: Membre[]): Promise<boolean> => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error("Utilisateur non authentifié");
    }

    const API_URL = getApiUrl();
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'p71x6d_system';
    const deviceId = localStorage.getItem('deviceId') || 'unknown';

    // Assurer que chaque membre a un userId
    const membresWithUserId = membres.map(membre => ({
      ...membre,
      userId: membre.userId || userId
    }));

    const response = await fetch(`${API_URL}/membres-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        deviceId,
        membres: membresWithUserId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // Mise à jour du cache
      membresCache = membresWithUserId;
      lastFetchTimestamp = Date.now();
      
      // Sauvegarde locale
      localStorage.setItem(`membres_${userId}`, JSON.stringify(membresWithUserId));
      
      // Enregistrer l'horodatage de la dernière synchronisation
      localStorage.setItem(`lastServerSync_membres_${userId}`, Date.now().toString());
      
      return true;
    } else {
      throw new Error(result.message || "Échec de la synchronisation");
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation des membres:", error);
    return false;
  }
};

export const clearMembresCache = (): void => {
  membresCache = null;
  lastFetchTimestamp = null;
  console.log("Cache membres effacé");
};
