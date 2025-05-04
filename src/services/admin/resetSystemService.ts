
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/components/ui/use-toast';

/**
 * Service pour réinitialiser complètement le système,
 * supprimer toutes les tables et les recréer pour l'administrateur
 */
export const resetEntireSystem = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  console.log("Démarrage de la réinitialisation complète du système");
  
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/reset-system.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        admin_email: 'antcirier@gmail.com',
        confirm: 'RESET_ALL_CONFIRM'
      })
    });
    
    console.log("Réponse de l'API reset-system:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur lors de la réinitialisation du système:", errorText);
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la réinitialisation:", result);
    
    // Nettoyer le stockage local après réinitialisation
    if (result.success) {
      localStorage.clear();
      sessionStorage.clear();
      
      // Forcer la déconnexion locale
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('authToken');
      
      console.log("Stockage local nettoyé suite à la réinitialisation");
    }
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du système:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Échec de la réinitialisation: ${errorMessage}`
    };
  }
};
