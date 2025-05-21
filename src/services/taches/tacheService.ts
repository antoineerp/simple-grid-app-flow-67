
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getCurrentUser } from '../core/databaseConnectionService';

// Définition du type Tache
interface Tache {
  id: string;
  titre: string;
  description?: string;
  date_echeance?: string;
  priorite?: 'faible' | 'moyenne' | 'haute';
  statut: 'a_faire' | 'en_cours' | 'terminee';
  responsable_id?: string;
}

// Récupère toutes les tâches
export const getTaches = async (): Promise<Tache[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/test_table-load.php?table=taches&userId=${userId}`, {
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
    return data.taches || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    return [];
  }
};

// Crée une nouvelle tâche
export const createTache = async (tache: Tache): Promise<Tache | null> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/test_table-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        table: 'taches',
        data: [tache]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? tache : null;
  } catch (error) {
    console.error("Erreur lors de la création d'une tâche:", error);
    throw error;
  }
};

// Met à jour une tâche existante
export const updateTache = async (tache: Tache): Promise<Tache | null> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/test_table-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        table: 'taches',
        data: [tache]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? tache : null;
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'une tâche:", error);
    throw error;
  }
};

// Supprime une tâche
export const deleteTache = async (tacheId: string): Promise<boolean> => {
  try {
    const taches = await getTaches();
    const updatedTaches = taches.filter(t => t.id !== tacheId);
    
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/test_table-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        table: 'taches',
        data: updatedTaches
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur lors de la suppression d'une tâche:", error);
    return false;
  }
};
