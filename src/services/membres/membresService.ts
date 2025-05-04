
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { validateJsonResponse, getHelpfulErrorFromHtml } from '@/utils/jsonValidator';

/**
 * Extrait un identifiant utilisateur valide pour les requêtes
 */
const extractValidUserId = (userId: any): string => {
  // Si l'entrée est undefined ou null
  if (userId === undefined || userId === null) {
    console.log("userId invalide (null/undefined), utilisation de l'ID par défaut");
    return 'p71x6d_system';
  }
  
  // Si c'est déjà une chaîne, la retourner directement (mais vérifier si c'est [object Object])
  if (typeof userId === 'string') {
    // Vérifier si la chaîne est [object Object]
    if (userId === '[object Object]' || userId.includes('object')) {
      console.log("userId est la chaîne '[object Object]', utilisation de l'ID par défaut");
      return 'p71x6d_system';
    }
    return userId;
  }
  
  // Si c'est un objet, essayer d'extraire un identifiant
  if (typeof userId === 'object') {
    // Journaliser l'identifiant reçu pour débogage
    console.log("Identifiant objet reçu:", JSON.stringify(userId));
    
    // Propriétés potentielles pour extraire un ID
    const idProperties = ['identifiant_technique', 'email', 'id'];
    
    for (const prop of idProperties) {
      if (userId[prop] && typeof userId[prop] === 'string' && userId[prop].length > 0) {
        console.log(`ID utilisateur extrait de l'objet: ${prop}=${userId[prop]}`);
        return userId[prop];
      }
    }
    
    // Si toString() renvoie quelque chose d'autre que [object Object], l'utiliser
    const userIdString = String(userId);
    if (userIdString !== '[object Object]' && userIdString !== 'null' && userIdString !== 'undefined') {
      console.log(`Conversion de l'objet en chaîne: ${userIdString}`);
      return userIdString;
    }
  }
  
  console.log(`Utilisation de l'ID par défaut: p71x6d_system`);
  return 'p71x6d_system'; // Valeur par défaut si rien n'est valide
};

/**
 * Charge les membres depuis le serveur
 */
export const loadMembresFromServer = async (currentUser: any): Promise<Membre[]> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire l'identifiant technique ou email de l'utilisateur
    const userId = extractValidUserId(currentUser);
    console.log(`Chargement des membres depuis le serveur pour l'utilisateur ${userId}`);
    
    // Vérifier que l'ID est bien une chaîne et non un objet
    if (typeof userId !== 'string') {
      throw new Error(`ID utilisateur invalide: ${typeof userId}`);
    }
    
    // Utiliser encodeURIComponent pour encoder l'ID utilisateur en toute sécurité
    const encodedUserId = encodeURIComponent(userId);
    const url = `${API_URL}/membres-load.php?userId=${encodedUserId}`;
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = `${url}&_t=${new Date().getTime()}`;
    
    // Ajout d'un logging pour déboguer
    console.log(`Requête membres: ${urlWithTimestamp}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout
    
    try {
      const response = await fetch(urlWithTimestamp, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Debug: Journaliser le statut et le texte de la réponse
      console.log(`Réponse membres statut: ${response.status}`);
      
      const responseText = await response.text();
      
      // Utiliser notre validateur JSON amélioré
      const validationResult = validateJsonResponse(responseText);
      
      if (!validationResult.isValid) {
        // Si HTML détecté, extraire une erreur plus informative
        if (validationResult.htmlDetected) {
          const helpfulError = getHelpfulErrorFromHtml(responseText);
          console.error(`Erreur HTML détectée: ${helpfulError}`);
          console.error(`Aperçu de la réponse HTML: ${responseText.substring(0, 300)}`);
          throw new Error(helpfulError);
        }
        
        throw new Error(validationResult.error || "Format de réponse invalide");
      }
      
      const result = validationResult.data;
      
      if (!result.success) {
        throw new Error(result.message || "Erreur inconnue lors du chargement des membres");
      }
      
      // Transformer les dates string en objets Date
      const membres = result.membres || [];
      return membres.map((membre: any) => ({
        ...membre,
        date_creation: membre.date_creation ? new Date(membre.date_creation) : new Date()
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors du chargement des membres");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des membres depuis le serveur:', error);
    throw error;
  }
};

/**
 * Synchronise les membres avec le serveur
 */
export const syncMembresWithServer = async (membres: Membre[], currentUser: any): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire l'identifiant technique ou email de l'utilisateur
    const userId = extractValidUserId(currentUser);
    console.log(`Synchronisation des membres pour l'utilisateur ${userId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes de timeout
    
    try {
      // Préparer les données à envoyer - convertir les objets Date en chaînes
      const membresForSync = membres.map(membre => ({
        ...membre,
        date_creation: membre.date_creation instanceof Date 
          ? membre.date_creation.toISOString() 
          : membre.date_creation
      }));
      
      // Journaliser pour le débogage
      console.log(`Envoi de ${membresForSync.length} membres pour synchronisation`);
      
      const response = await fetch(`${API_URL}/membres-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, membres: membresForSync }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseText = await response.text();
      
      // Utiliser notre validateur JSON amélioré
      const validationResult = validateJsonResponse(responseText);
      
      if (!validationResult.isValid) {
        // Si HTML détecté, extraire une erreur plus informative
        if (validationResult.htmlDetected) {
          const helpfulError = getHelpfulErrorFromHtml(responseText);
          console.error(`Erreur HTML détectée: ${helpfulError}`);
          console.error(`Aperçu de la réponse HTML: ${responseText.substring(0, 300)}`);
          throw new Error(helpfulError);
        }
        
        throw new Error(validationResult.error || "Format de réponse invalide");
      }
      
      const result = validationResult.data;
      console.log("Résultat de la synchronisation des membres:", result);
      
      if (!result.success) {
        throw new Error(result.message || "Erreur de synchronisation inconnue");
      }
      
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors de la synchronisation");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur de synchronisation des membres:', error);
    throw error;
  }
};

/**
 * Charge les membres depuis le stockage local ou le serveur
 */
export const getMembres = async (): Promise<Membre[]> => {
  try {
    // D'abord essayer de charger depuis le serveur
    const currentUser = localStorage.getItem('currentUser');
    const user = currentUser ? JSON.parse(currentUser) : null;
    
    return await loadMembresFromServer(user);
  } catch (error) {
    console.error("Erreur lors du chargement des membres depuis le serveur:", error);
    
    // En cas d'échec, charger depuis le local storage
    try {
      const localMembres = localStorage.getItem('membres');
      if (localMembres) {
        const parsed = JSON.parse(localMembres);
        console.log("Membres chargés depuis le stockage local:", parsed.length);
        return parsed;
      }
    } catch (localError) {
      console.error("Erreur lors du chargement des membres depuis le stockage local:", localError);
    }
    
    // Si tout échoue, renvoyer un tableau vide
    return [];
  }
};

/**
 * Synchronise les membres avec le serveur et met à jour le stockage local
 */
export const syncMembres = async (membres: Membre[]): Promise<boolean> => {
  try {
    // Sauvegarder localement d'abord
    localStorage.setItem('membres', JSON.stringify(membres));
    
    // Ensuite synchroniser avec le serveur
    const currentUser = localStorage.getItem('currentUser');
    const user = currentUser ? JSON.parse(currentUser) : null;
    
    return await syncMembresWithServer(membres, user);
  } catch (error) {
    console.error("Erreur lors de la synchronisation des membres:", error);
    return false;
  }
};

