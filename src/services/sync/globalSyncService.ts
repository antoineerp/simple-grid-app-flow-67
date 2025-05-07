
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { syncQueueManager } from './syncQueueService';

/**
 * Structure des données de l'application
 */
export interface AppData {
  documents?: any[];
  exigences?: any[];
  membres?: any[];
  pilotageDocuments?: any[];
  bibliotheque?: {
    documents: any[];
    groups: any[];
  };
  // Autres données à synchroniser
  lastModified?: number; // Horodatage de la dernière modification
}

/**
 * Normalise l'identifiant utilisateur pour la synchronisation
 * @param userId L'identifiant utilisateur (chaîne ou objet)
 * @returns Un identifiant utilisateur normalisé
 */
const normalizeUserId = (userId: any): string => {
  if (!userId) return 'default';
  
  if (typeof userId === 'string') {
    try {
      // Vérifier si c'est un objet JSON stocké sous forme de chaîne
      const userObj = JSON.parse(userId);
      return userObj.identifiant_technique || 
             userObj.id?.toString() || 
             'default';
    } catch (e) {
      // Ce n'est pas du JSON valide, utiliser la chaîne directement
      return userId;
    }
  } else if (typeof userId === 'object') {
    // C'est déjà un objet
    return userId.identifiant_technique || 
           userId.id?.toString() || 
           'default';
  }
  
  // Fallback
  return String(userId);
};

/**
 * Service centralisé pour la synchronisation globale des données avec le serveur
 */
export const syncAllWithServer = async (
  userId: any,
  data: AppData
): Promise<boolean> => {
  try {
    const normalizedId = normalizeUserId(userId);
    console.log(`Synchronisation globale pour l'utilisateur ${normalizedId}`);
    
    // Ajouter l'horodatage de la dernière modification
    const dataWithTimestamp = {
      ...data,
      lastModified: Date.now()
    };
    
    // Ajouter à la file d'attente au lieu de synchroniser immédiatement
    syncQueueManager.addToQueue({
      type: 'global',
      userId: normalizedId,
      data: {
        userId: normalizedId,
        data: dataWithTimestamp
      }
    });
    
    // Commencer le traitement de la file d'attente
    syncQueueManager.processQueue();
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la file de synchronisation globale:', error);
    return false;
  }
};

/**
 * Charge toutes les données depuis le serveur
 */
export const loadAllFromServer = async (userId: any): Promise<AppData | null> => {
  try {
    const normalizedId = normalizeUserId(userId);
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/global-load.php?userId=${encodeURIComponent(normalizedId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement global: ${response.status}`);
      throw new Error(`Échec du chargement global: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Ajouter l'horodatage de chargement
    const data = result.data || null;
    if (data) {
      data.lastModified = Date.now();
    }
    
    return data;
  } catch (error) {
    console.error('Erreur de chargement global:', error);
    return null;
  }
};

/**
 * Enregistre toutes les données dans le localStorage
 */
export const saveAllToStorage = (userId: any, data: AppData): void => {
  const normalizedId = normalizeUserId(userId);
  
  // Ajouter l'horodatage de la dernière modification
  const timestamp = Date.now();
  const dataWithTimestamp = {
    ...data,
    lastModified: timestamp
  };
  
  // Sauvegarder chaque type de données dans son emplacement approprié
  if (dataWithTimestamp.documents) {
    localStorage.setItem(`documents_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.documents,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.exigences) {
    localStorage.setItem(`exigences_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.exigences,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.membres) {
    localStorage.setItem(`membres_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.membres,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.pilotageDocuments) {
    localStorage.setItem(`pilotage_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.pilotageDocuments,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.bibliotheque) {
    const { documents, groups } = dataWithTimestamp.bibliotheque;
    localStorage.setItem(`bibliotheque_documents_${normalizedId}`, JSON.stringify({
      data: documents,
      lastModified: timestamp
    }));
    localStorage.setItem(`bibliotheque_groups_${normalizedId}`, JSON.stringify({
      data: groups,
      lastModified: timestamp
    }));
  }
  
  // Déclencher un événement global pour informer l'application qu'une mise à jour a été effectuée
  window.dispatchEvent(new Event('globalDataUpdate'));
};

/**
 * Charge toutes les données depuis le localStorage
 */
export const loadAllFromStorage = (userId: any): AppData => {
  const normalizedId = normalizeUserId(userId);
  const data: AppData = {};
  let globalLastModified = 0;
  
  const documentsJson = localStorage.getItem(`documents_${normalizedId}`);
  if (documentsJson) {
    try {
      const parsed = JSON.parse(documentsJson);
      data.documents = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des documents:", e);
    }
  }
  
  const exigencesJson = localStorage.getItem(`exigences_${normalizedId}`);
  if (exigencesJson) {
    try {
      const parsed = JSON.parse(exigencesJson);
      data.exigences = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des exigences:", e);
    }
  }
  
  const membresJson = localStorage.getItem(`membres_${normalizedId}`);
  if (membresJson) {
    try {
      const parsed = JSON.parse(membresJson);
      data.membres = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des membres:", e);
    }
  }
  
  const pilotageJson = localStorage.getItem(`pilotage_${normalizedId}`);
  if (pilotageJson) {
    try {
      const parsed = JSON.parse(pilotageJson);
      data.pilotageDocuments = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des documents de pilotage:", e);
    }
  }
  
  const bibliothequeDocumentsJson = localStorage.getItem(`bibliotheque_documents_${normalizedId}`);
  const bibliothequeGroupsJson = localStorage.getItem(`bibliotheque_groups_${normalizedId}`);
  
  if (bibliothequeDocumentsJson || bibliothequeGroupsJson) {
    data.bibliotheque = {
      documents: [],
      groups: []
    };
    
    if (bibliothequeDocumentsJson) {
      try {
        const parsed = JSON.parse(bibliothequeDocumentsJson);
        data.bibliotheque.documents = parsed.data || parsed;
        if (parsed.lastModified && parsed.lastModified > globalLastModified) {
          globalLastModified = parsed.lastModified;
        }
      } catch (e) {
        console.error("Erreur lors du parsing des documents bibliothèque:", e);
      }
    }
    
    if (bibliothequeGroupsJson) {
      try {
        const parsed = JSON.parse(bibliothequeGroupsJson);
        data.bibliotheque.groups = parsed.data || parsed;
        if (parsed.lastModified && parsed.lastModified > globalLastModified) {
          globalLastModified = parsed.lastModified;
        }
      } catch (e) {
        console.error("Erreur lors du parsing des groupes de bibliothèque:", e);
      }
    }
  }
  
  // Ajouter l'horodatage global le plus récent
  data.lastModified = globalLastModified || Date.now();
  
  return data;
};

/**
 * Vérifie si des données ont été modifiées depuis la dernière synchronisation
 */
export const hasUnsyncedChanges = (lastSynced: Date | null, data: AppData): boolean => {
  if (!lastSynced) return true;
  
  const lastSyncedTime = lastSynced.getTime();
  const lastModified = data.lastModified || 0;
  
  return lastModified > lastSyncedTime;
};

/**
 * Obtient le statut de la file d'attente de synchronisation
 */
export const getSyncQueueStatus = () => {
  return syncQueueManager.getQueueStatus();
};

/**
 * Réessaye les opérations de synchronisation échouées
 */
export const retryFailedSyncs = () => {
  return syncQueueManager.retryFailedOperations();
};

/**
 * Efface les opérations de synchronisation échouées
 */
export const clearFailedSyncs = () => {
  return syncQueueManager.clearFailedOperations();
};
