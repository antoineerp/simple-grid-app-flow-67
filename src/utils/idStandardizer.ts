
/**
 * Utilitaire pour standardiser les identifiants et gérer les problèmes d'ID
 * Version améliorée pour traiter toutes les tables
 */
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';

/**
 * Déclenche la standardisation des IDs pour un utilisateur spécifique
 * @param userId - Identifiant de l'utilisateur
 * @param tableName - Nom de la table à standardiser (optionnel, toutes les tables si non spécifié)
 */
export const standardizeIds = async (
  userId: string, 
  tableName?: string
): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    if (!API_URL) {
      throw new Error("URL de l'API non configurée");
    }
    
    // Sanitize userId pour éviter les injections
    const safeUserId = encodeURIComponent(userId.replace(/[^a-zA-Z0-9_]/g, '_'));
    
    // Construire l'URL avec le paramètre tableName si fourni
    let url = `${API_URL}/check.php?action=standardize_ids&userId=${safeUserId}`;
    if (tableName) {
      url += `&tableName=${encodeURIComponent(tableName)}`;
    }
    
    const response = await fetch(url, {
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
        description: result.tableName 
          ? `${result.converted} IDs ont été convertis au format UUID dans la table ${result.tableName}.`
          : `${result.totalConverted} IDs ont été convertis au format UUID dans ${result.tablesProcessed} tables.`,
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
 * et supprime les entrées dupliquées dans l'historique de synchronisation
 */
export const cleanCorruptedIdData = async (): Promise<boolean> => {
  try {
    // Étape 1: Nettoyage des données locales corrompues
    const keysToDelete: string[] = [];
    
    // Rechercher toutes les clés qui pourraient être corrompues
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('_last_saved') || key.includes('sync_'))) {
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
      
      // Supprimer aussi les données associées sans le suffixe
      const baseKey = key.replace('_last_saved', '').replace('sync_', '');
      localStorage.removeItem(baseKey);
      console.log(`Données associées supprimées: ${baseKey}`);
    });
    
    // Étape 2: Nettoyer les doublons dans l'historique de synchronisation côté serveur
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/check.php?action=cleanup_duplicates`, {
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
        toast({
          title: "Nettoyage effectué",
          description: `${keysToDelete.length} entrées locales et ${result.duplicatesRemoved} entrées serveur ont été nettoyées.`,
        });
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage de l'historique:", error);
      
      toast({
        title: "Nettoyage partiel",
        description: `${keysToDelete.length} entrées locales nettoyées, mais erreur serveur: ${error instanceof Error ? error.message : String(error)}`,
      });
      
      return keysToDelete.length > 0;
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des données corrompues:', error);
    return false;
  }
};

/**
 * Vérifie la cohérence de synchronisation entre toutes les tables
 * Renvoie un rapport détaillé sur l'état de la synchronisation
 */
export const checkSyncConsistency = async (userId: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const API_URL = getApiUrl();
    if (!API_URL) {
      throw new Error("URL de l'API non configurée");
    }
    
    // Sanitize userId pour éviter les injections
    const safeUserId = encodeURIComponent(userId.replace(/[^a-zA-Z0-9_]/g, '_'));
    
    const response = await fetch(`${API_URL}/check.php?action=check_sync_consistency&userId=${safeUserId}`, {
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
    
    return {
      success: result.status === 'success',
      message: result.message,
      details: result.details
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de la cohérence de synchronisation:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur s'est produite"
    };
  }
};

