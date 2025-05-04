
import { getApiUrl } from '@/config/apiConfig';
import { getAuthToken } from '@/services/auth/authService';

export interface Checkbox {
  id: number;
  category: string;
  label: string;
  sortOrder: number;
  isSelected: boolean;
}

export interface SelectionsUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Récupère toutes les sélections de l'utilisateur actuellement connecté
 */
export async function getUserSelections(): Promise<Checkbox[]> {
  try {
    const response = await fetch(`${getApiUrl()}/selections.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des sélections');
    }

    const data = await response.json();
    return data.data.selections || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des sélections:', error);
    throw error;
  }
}

/**
 * Met à jour une sélection utilisateur
 * @param checkboxId ID de la checkbox à mettre à jour
 * @param isSelected Nouvel état (cochée ou non)
 */
export async function updateSelection(checkboxId: number, isSelected: boolean): Promise<SelectionsUpdateResponse> {
  try {
    const response = await fetch(`${getApiUrl()}/selections.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ checkboxId, isSelected })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour de la sélection');
    }

    return {
      success: true,
      message: data.message || 'Mise à jour réussie'
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la sélection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Met à jour plusieurs sélections en une seule opération
 * @param selectedIds IDs des checkboxes à sélectionner
 */
export async function bulkUpdateSelections(selectedIds: number[]): Promise<SelectionsUpdateResponse> {
  try {
    const response = await fetch(`${getApiUrl()}/selections.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ selections: selectedIds })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour des sélections');
    }

    return {
      success: true,
      message: data.message || 'Mise à jour réussie'
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des sélections:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
