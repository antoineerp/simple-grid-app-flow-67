
/**
 * Utilitaire pour standardiser les identifiants et gérer les problèmes d'ID
 */
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';

/**
 * Déclenche la standardisation des IDs des membres pour un utilisateur spécifique
 */
export const standardizeIds = async (userId: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    if (!API_URL) {
      throw new Error("URL de l'API non configurée");
    }
    
    // Sanitize userId pour éviter les injections
    const safeUserId = encodeURIComponent(userId.replace(/[^a-zA-Z0-9_]/g, '_'));
    
    const response = await fetch(`${API_URL}/check.php?action=standardize_ids&userId=${safeUserId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log(`Standardisation des IDs: ${result.message}`);
      toast({
        title: "IDs standardisés",
        description: `${result.converted} IDs ont été convertis au format UUID.`,
      });
      return true;
    } else {
      console.error(`Erreur de standardisation: ${result.message}`);
      toast({
        title: "Erreur de standardisation",
        description: result.message,
        variant: "destructive"
      });
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la standardisation des IDs:', error);
    toast({
      title: "Erreur",
      description: error instanceof Error ? error.message : "Une erreur s'est produite",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Nettoie les données corrompues du localStorage liées aux problèmes d'ID
 */
export const cleanCorruptedIdData = (): boolean => {
  try {
    const keysToDelete: string[] = [];
    
    // Rechercher toutes les clés qui pourraient être corrompues
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_last_saved')) {
        try {
          // Tester si c'est un JSON valide
          const value = localStorage.getItem(key);
          if (value) {
            JSON.parse(value);
          }
        } catch (e) {
          // Si le parsing échoue, marquer pour suppression
          keysToDelete.push(key);
          console.log(`Données corrompues détectées: ${key}`);
        }
      }
    }
    
    // Supprimer les données corrompues
    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Données corrompues supprimées: ${key}`);
      
      // Supprimer aussi les données associées sans le suffixe _last_saved
      const baseKey = key.replace('_last_saved', '');
      localStorage.removeItem(baseKey);
      console.log(`Données associées supprimées: ${baseKey}`);
    });
    
    if (keysToDelete.length > 0) {
      toast({
        title: "Nettoyage effectué",
        description: `${keysToDelete.length} entrées corrompues ont été supprimées.`,
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors du nettoyage des données corrompues:', error);
    return false;
  }
};
