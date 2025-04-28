
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Charge les membres depuis le serveur Infomaniak uniquement
 */
export const loadMembresFromServer = async (currentUser: string): Promise<Membre[]> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Chargement des membres depuis le serveur pour l'utilisateur ${currentUser}`);
    
    const encodedUserId = encodeURIComponent(currentUser);
    const url = `${API_URL}/membres-load.php?userId=${encodedUserId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || "Erreur inconnue lors du chargement des membres");
    }
    
    return result.membres || [];
  } catch (error) {
    console.error('Erreur lors du chargement des membres depuis le serveur:', error);
    throw error;
  }
};

/**
 * Synchronise les membres avec le serveur Infomaniak uniquement
 */
export const syncMembresWithServer = async (membres: Membre[], currentUser: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Synchronisation des membres pour l'utilisateur ${currentUser}`);
    
    const response = await fetch(`${API_URL}/membres-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUser, membres })
    });
    
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
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des membres:", result);
    
    if (!result.success) {
      throw new Error(result.message || "Erreur de synchronisation inconnue");
    }
    
    return true;
  } catch (error) {
    console.error('Erreur de synchronisation des membres:', error);
    throw error;
  }
};
