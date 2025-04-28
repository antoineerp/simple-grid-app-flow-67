
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
    console.log(`Envoi des données à: ${API_URL}/membres-sync.php`);
    
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
      try {
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
        
        // Si c'est du JSON, parserons-le
        if (errorText.trim().startsWith('{')) {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Échec de la synchronisation des membres: ${response.statusText}`);
        }
      } catch (parseErr) {
        // Rien à faire, on utilisera le message d'erreur générique
      }
      
      throw new Error(`Échec de la synchronisation des membres: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des membres:", result);
    
    if (!result.success) {
      throw new Error(result.message || "Erreur de synchronisation inconnue");
    }
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur de synchronisation des membres:', error);
    throw error; // Propager l'erreur pour la gestion côté contexte
  }
};

/**
 * Loads membres from server
 */
export const loadMembresFromServer = async (currentUser: string): Promise<Membre[] | null> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Chargement des membres pour l'utilisateur ${currentUser} depuis: ${API_URL}/membres-load.php`);
    
    const encodedUserId = encodeURIComponent(currentUser);
    const url = `${API_URL}/membres-load.php?userId=${encodedUserId}`;
    console.log(`URL complète: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store' // Désactiver la mise en cache
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement des membres: ${response.status}`);
      
      // Essayer de récupérer les détails de l'erreur
      try {
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
        
        // Si c'est du JSON, parserons-le
        if (errorText.trim().startsWith('{')) {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Échec du chargement des membres: ${response.statusText}`);
        }
      } catch (parseErr) {
        // Rien à faire, on utilisera le message d'erreur générique
      }
      
      throw new Error(`Échec du chargement des membres: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Membres chargés depuis le serveur:", result);
    
    return result.membres || null;
  } catch (error) {
    console.error('Erreur de chargement des membres:', error);
    throw error; // Propager l'erreur pour la gestion côté contexte
  }
};
