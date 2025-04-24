
import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (
  exigences: Exigence[],
  currentUser: string
): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Synchronisation des exigences pour l'utilisateur ${currentUser} avec le serveur: ${API_URL}`);
    
    const response = await fetch(`${API_URL}/exigences-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUser, exigences })
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la synchronisation des exigences: ${response.status}`);
      const errorText = await response.text();
      console.error("Détails de l'erreur:", errorText);
      throw new Error(`Échec de la synchronisation des exigences: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des exigences:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur de synchronisation des exigences:', error);
    return false;
  }
};

/**
 * Charge les exigences depuis le serveur
 */
export const loadExigencesFromServer = async (currentUser: string): Promise<Exigence[] | null> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Chargement des exigences pour l'utilisateur ${currentUser} depuis le serveur: ${API_URL}`);
    
    const response = await fetch(`${API_URL}/exigences-load.php?userId=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement des exigences: ${response.status}`);
      throw new Error(`Échec du chargement des exigences: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Exigences chargées depuis le serveur:", result);
    
    return result.exigences || null;
  } catch (error) {
    console.error('Erreur de chargement des exigences:', error);
    return null;
  }
};
