import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { loadDataFromStorage, saveDataToStorage } from '@/services/core/dataStorageService';
import { loadData, saveData } from '@/services/sync/syncService';
import { toast } from '@/components/ui/use-toast';
import { getUserStorageKey } from '@/services/core/userIdValidator';

// Récupère toutes les exigences
export const getExigences = async (): Promise<Exigence[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/exigences-load.php?userId=${userId}`, {
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
    return data.exigences || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des exigences:", error);
    return [];
  }
};

// Crée une nouvelle exigence
export const createExigence = async (exigence: Exigence): Promise<Exigence | null> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/exigences-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        exigences: [exigence]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? exigence : null;
  } catch (error) {
    console.error("Erreur lors de la création d'une exigence:", error);
    throw error;
  }
};

// Met à jour une exigence existante
export const updateExigence = async (exigence: Exigence): Promise<Exigence | null> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/exigences-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        exigences: [exigence]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? exigence : null;
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'une exigence:", error);
    throw error;
  }
};

// Supprime une exigence
export const deleteExigence = async (exigenceId: string): Promise<boolean> => {
  try {
    // Pour la suppression, nous récupérons toutes les exigences, supprimons celle qui correspond
    // et synchronisons le tout
    const exigences = await getExigences();
    const updatedExigences = exigences.filter(e => e.id !== exigenceId);
    
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/exigences-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        exigences: updatedExigences
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur lors de la suppression d'une exigence:", error);
    return false;
  }
};
