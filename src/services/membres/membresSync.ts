
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Synchronizes membres with the server
 */
export const syncMembresWithServer = async (
  membres: Membre[],
  currentUser: string
): Promise<boolean> => {
  try {
    console.log(`Synchronisation des membres pour l'utilisateur ${currentUser}`);
    
    const API_URL = getApiUrl();
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
      const errorText = await response.text();
      console.error("Détails de l'erreur:", errorText);
      throw new Error(`Échec de la synchronisation des membres: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des membres:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur de synchronisation des membres:', error);
    return false;
  }
};

/**
 * Loads membres from server
 */
export const loadMembresFromServer = async (currentUser: string): Promise<Membre[] | null> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Chargement des membres pour l'utilisateur ${currentUser} depuis: ${API_URL}/membres-load.php`);
    
    const response = await fetch(`${API_URL}/membres-load.php?userId=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement des membres: ${response.status}`);
      throw new Error(`Échec du chargement des membres: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Membres chargés depuis le serveur:", result);
    
    return result.membres || null;
  } catch (error) {
    console.error('Erreur de chargement des membres:', error);
    return null;
  }
};
