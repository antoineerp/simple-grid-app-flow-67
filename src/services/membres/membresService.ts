
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

export const loadMembresFromStorage = async (currentUser: string): Promise<Membre[]> => {
  try {
    console.log("Chargement des membres depuis le serveur pour:", currentUser);
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/controllers/MembresController.php?user_id=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status}`);
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.membres)) {
      console.warn("Format de données invalide ou vide reçu du serveur");
      return [];
    }

    // Conversion des dates
    return data.membres.map((membre: any) => ({
      ...membre,
      date_creation: new Date(membre.date_creation)
    }));
  } catch (error) {
    console.error("Erreur lors du chargement des membres depuis le serveur:", error);
    throw error;
  }
};

export const saveMembresInStorage = async (membres: Membre[], currentUser: string): Promise<boolean> => {
  try {
    console.log(`Sauvegarde de ${membres.length} membres pour ${currentUser}`);
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/controllers/MembresController.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: currentUser,
        membres: membres
      })
    });

    if (!response.ok) {
      console.error(`Erreur HTTP lors de la sauvegarde: ${response.status}`);
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      console.error(data.message || "Erreur serveur non spécifiée");
      throw new Error(data.message || "Erreur serveur non spécifiée");
    }

    console.log("Membres sauvegardés avec succès sur le serveur");
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des membres sur le serveur:", error);
    throw error;
  }
};

// Cette fonction est simplifiée car elle fait la même chose que saveMembresInStorage
export const syncMembresWithServer = async (
  membres: Membre[],
  currentUser: string
): Promise<boolean> => {
  return await saveMembresInStorage(membres, currentUser);
};
