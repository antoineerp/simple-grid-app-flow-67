
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getCurrentUser } from '../core/databaseConnectionService';

// Récupère tous les membres
export const getMembres = async (): Promise<Membre[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/membres-load.php?userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.membres || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    return [];
  }
};

// Crée un nouveau membre
export const createMembre = async (membre: Membre): Promise<Membre | null> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/membres-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        membres: [membre]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? membre : null;
  } catch (error) {
    console.error("Erreur lors de la création d'un membre:", error);
    throw error;
  }
};

// Met à jour un membre existant
export const updateMembre = async (membre: Membre): Promise<Membre | null> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/membres-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        membres: [membre]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? membre : null;
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un membre:", error);
    throw error;
  }
};

// Supprime un membre
export const deleteMembre = async (membreId: string): Promise<boolean> => {
  try {
    // Pour la suppression, nous récupérons tous les membres, supprimons celui qui correspond
    // et synchronisons le tout
    const membres = await getMembres();
    const updatedMembres = membres.filter(m => m.id !== membreId);
    
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/membres-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        membres: updatedMembres
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur lors de la suppression d'un membre:", error);
    return false;
  }
};
