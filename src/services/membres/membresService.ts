
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

export const loadMembresFromStorage = async (currentUser: string): Promise<Membre[]> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/controllers/MembresController.php?user_id=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.membres)) {
      console.warn("Format de données invalide ou vide reçu du serveur");
      return [];
    }

    return data.membres.map((membre: any) => ({
      ...membre,
      date_creation: new Date(membre.date_creation)
    }));
  } catch (error) {
    console.error("Erreur lors du chargement des membres depuis le serveur:", error);
    return [];
  }
};

export const saveMembresInStorage = async (membres: Membre[], currentUser: string): Promise<boolean> => {
  try {
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
      console.error(`Erreur HTTP: ${response.status}`);
      return false;
    }

    const data = await response.json();
    if (!data.success) {
      console.error(data.message || "Erreur serveur non spécifiée");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des membres sur le serveur:", error);
    return false;
  }
};

export const syncMembresWithServer = async (
  membres: Membre[],
  currentUser: string
): Promise<boolean> => {
  try {
    return await saveMembresInStorage(membres, currentUser);
  } catch (error) {
    console.error("Erreur lors de la synchronisation des membres avec le serveur:", error);
    return false;
  }
};
