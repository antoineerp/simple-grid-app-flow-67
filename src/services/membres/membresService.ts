
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Extrait un identifiant utilisateur valide pour les requêtes
 */
const extractValidUserId = (userId: any): string => {
  if (typeof userId === 'string') {
    return userId;
  }
  
  if (userId && typeof userId === 'object') {
    return userId.identifiant_technique || 
           userId.email || 
           'p71x6d_system';
  }
  
  return 'p71x6d_system'; // Valeur par défaut si rien n'est valide
};

/**
 * Charge les membres depuis le serveur Infomaniak uniquement
 */
export const loadMembresFromServer = async (currentUser: any): Promise<Membre[]> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire l'identifiant technique ou email de l'utilisateur
    const userId = extractValidUserId(currentUser);
    console.log(`Chargement des membres depuis le serveur pour l'utilisateur ${userId}`);
    
    // Utiliser userId extrait pour éviter l'encodage d'[object Object]
    const encodedUserId = encodeURIComponent(userId);
    const url = `${API_URL}/membres-load.php?userId=${encodedUserId}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(result.message || "Erreur inconnue lors du chargement des membres");
      }
      
      return result.membres || [];
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
 * Synchronise les membres avec le serveur Infomaniak uniquement
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
      const response = await fetch(`${API_URL}/membres-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId, membres }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Erreur lors de la synchronisation des membres: ${response.status}`);
        
        // Essayer de récupérer les détails de l'erreur
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
        
        if (errorText.trim().startsWith('{')) {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Échec de la synchronisation: ${response.statusText}`);
        }
        
        throw new Error(`Échec de la synchronisation: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      try {
        const result = JSON.parse(responseText);
        console.log("Résultat de la synchronisation des membres:", result);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur de synchronisation inconnue");
        }
        
        return true;
      } catch (e) {
        console.error("Erreur lors du parsing de la réponse:", e);
        console.error("Réponse brute reçue:", responseText);
        throw new Error("Impossible de traiter la réponse du serveur");
      }
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
