
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

/**
 * Service pour réinitialiser complètement le système
 * ATTENTION: Cette fonction est dangereuse et doit être utilisée uniquement en développement
 */
export const resetEntireSystem = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log("Tentative de réinitialisation complète du système");
    
    // Code de confirmation spécial pour autoriser la réinitialisation
    const confirmationCode = 'RESET_ALL_SYSTEM_2024';
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/admin/reset-system.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirmationCode,
        timestamp: new Date().getTime()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erreur lors de la réinitialisation: ${errorData.message || response.statusText}`);
      return {
        success: false,
        message: errorData.message || "La réinitialisation a échoué",
      };
    }
    
    const result = await response.json();
    console.log(`Résultat de la réinitialisation: ${JSON.stringify(result)}`);
    
    // Vider le stockage local et les caches
    localStorage.clear();
    sessionStorage.clear();
    
    return {
      success: true,
      message: "Le système a été réinitialisé avec succès. Un nouvel utilisateur a été créé.",
      details: result.details
    };
  } catch (error) {
    console.error(`Erreur lors de la réinitialisation du système: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      message: `La réinitialisation a échoué: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
    };
  }
};
