
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getCurrentUser as getDatabaseConnectionCurrentUser } from './databaseConnectionService';
import { Utilisateur } from '@/services';

export const adminImportFromManager = async (): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/manager-import`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: getDatabaseConnectionCurrentUser()
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur pendant l'import depuis le gestionnaire:", error);
    throw error;
  }
};
