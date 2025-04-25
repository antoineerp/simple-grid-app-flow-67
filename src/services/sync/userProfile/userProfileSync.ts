
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { validateApiResponse } from '../validators/apiResponseValidator';
import { toast } from '@/hooks/use-toast';

/**
 * Synchronise les données du profil utilisateur avec le serveur
 */
export const syncUserProfileWithServer = async (
  userData: any,
  forceUser?: string
): Promise<boolean> => {
  try {
    if (!forceUser) {
      console.error('❌ SYNCHRONISATION - Aucun utilisateur spécifié');
      return false;
    }
    
    console.log(`🔄 SYNCHRONISATION - Profil utilisateur ${forceUser}`);
    
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-profile-sync.php`;
    const requestId = `req_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({ 
        userId: forceUser, 
        userData,
        timestamp: new Date().toISOString(),
        requestId
      })
    });
    
    const result = await validateApiResponse(response);
    
    if (result.success === true) {
      console.log("✅ SUCCÈS - Résultat synchronisation:", result);
      toast({
        title: "Profil synchronisé",
        description: "Vos données ont été enregistrées sur le serveur"
      });
      return true;
    } else {
      throw new Error(result.message || "Échec de la synchronisation");
    }
  } catch (error) {
    console.error('❌ EXCEPTION - Synchronisation du profil:', error);
    
    let errorMessage = "Impossible d'enregistrer vos données sur le serveur";
    if (error instanceof Error) {
      if (error.message.includes('PHP n\'est pas exécuté')) {
        errorMessage = "Erreur de configuration serveur: PHP n'est pas exécuté correctement";
      } else if (error.message.includes('Impossible de parser le JSON')) {
        errorMessage = "Erreur serveur: réponse invalide";
      }
    }
    
    toast({
      title: "Échec de synchronisation",
      description: errorMessage,
      variant: "destructive"
    });
    
    return false;
  }
};

/**
 * Charge les données du profil utilisateur depuis le serveur
 */
export const loadUserProfileFromServer = async (forceUser?: string): Promise<any | null> => {
  try {
    if (!forceUser) {
      console.error('❌ CHARGEMENT - Aucun utilisateur spécifié');
      return null;
    }
    
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-profile-load.php`;
    const requestId = `req_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const response = await fetch(`${endpoint}?userId=${encodeURIComponent(forceUser)}&requestId=${requestId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'X-Request-ID': requestId,
      }
    });
    
    const result = await validateApiResponse(response);
    
    if (result.success && Object.keys(result.userData || {}).length > 0) {
      console.log("📥 DONNÉES - Profil chargé:", result);
      toast({
        title: "Profil chargé",
        description: "Vos données ont été récupérées depuis le serveur"
      });
      return result.userData;
    } else {
      console.log("ℹ️ INFO - Aucune donnée ou profil vide:", result);
      return null;
    }
  } catch (error) {
    console.error('❌ EXCEPTION - Chargement du profil:', error);
    
    let errorMessage = "Impossible de récupérer vos données depuis le serveur";
    if (error instanceof Error) {
      if (error.message.includes('PHP n\'est pas exécuté')) {
        errorMessage = "Erreur de configuration serveur: PHP n'est pas exécuté correctement";
      } else if (error.message.includes('Impossible de parser le JSON')) {
        errorMessage = "Erreur serveur: réponse invalide";
      }
    }
    
    toast({
      title: "Échec de chargement",
      description: errorMessage,
      variant: "destructive"
    });
    
    return null;
  }
};

export const forceReloadUserProfile = async (): Promise<any> => {
  console.log('🔄 RECHARGEMENT FORCÉ - Demande de rechargement du profil utilisateur');
  return await loadUserProfileFromServer();
};
