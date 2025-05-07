
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

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
    
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/global-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: normalizedId,
        data
      })
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la synchronisation globale: ${response.status}`);
      const errorText = await response.text();
      console.error("Détails de l'erreur:", errorText);
      throw new Error(`Échec de la synchronisation globale: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation globale:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur de synchronisation globale:', error);
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
    console.log(`Chargement global des données pour l'utilisateur ${normalizedId}`);
    
    const response = await fetch(`${API_URL}/global-load.php?userId=${encodeURIComponent(normalizedId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement global: ${response.status}`);
      throw new Error(`Échec du chargement global: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Données globales chargées depuis le serveur:", result);
    
    return result.data || null;
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
  
  // Sauvegarder chaque type de données dans son emplacement approprié
  if (data.documents) {
    localStorage.setItem(`documents_${normalizedId}`, JSON.stringify(data.documents));
  }
  
  if (data.exigences) {
    localStorage.setItem(`exigences_${normalizedId}`, JSON.stringify(data.exigences));
  }
  
  if (data.membres) {
    localStorage.setItem(`membres_${normalizedId}`, JSON.stringify(data.membres));
  }
  
  if (data.pilotageDocuments) {
    localStorage.setItem(`pilotage_${normalizedId}`, JSON.stringify(data.pilotageDocuments));
  }
  
  if (data.bibliotheque) {
    const { documents, groups } = data.bibliotheque;
    localStorage.setItem(`bibliotheque_documents_${normalizedId}`, JSON.stringify(documents));
    localStorage.setItem(`bibliotheque_groups_${normalizedId}`, JSON.stringify(groups));
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
  
  const documentsJson = localStorage.getItem(`documents_${normalizedId}`);
  if (documentsJson) {
    data.documents = JSON.parse(documentsJson);
  }
  
  const exigencesJson = localStorage.getItem(`exigences_${normalizedId}`);
  if (exigencesJson) {
    data.exigences = JSON.parse(exigencesJson);
  }
  
  const membresJson = localStorage.getItem(`membres_${normalizedId}`);
  if (membresJson) {
    data.membres = JSON.parse(membresJson);
  }
  
  const pilotageJson = localStorage.getItem(`pilotage_${normalizedId}`);
  if (pilotageJson) {
    data.pilotageDocuments = JSON.parse(pilotageJson);
  }
  
  const bibliothequeDocumentsJson = localStorage.getItem(`bibliotheque_documents_${normalizedId}`);
  const bibliothequeGroupsJson = localStorage.getItem(`bibliotheque_groups_${normalizedId}`);
  if (bibliothequeDocumentsJson || bibliothequeGroupsJson) {
    data.bibliotheque = {
      documents: bibliothequeDocumentsJson ? JSON.parse(bibliothequeDocumentsJson) : [],
      groups: bibliothequeGroupsJson ? JSON.parse(bibliothequeGroupsJson) : []
    };
  }
  
  return data;
};
