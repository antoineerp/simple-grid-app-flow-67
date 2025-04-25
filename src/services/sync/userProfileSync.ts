
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

/**
 * Synchronise les données du profil utilisateur avec le serveur
 */
export const syncUserProfileWithServer = async (
  userData: any,
  forceUser?: string
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur connecté à la base de données
    const currentUser = forceUser || getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ SYNCHRONISATION - Aucun utilisateur connecté à la base de données');
      return false;
    }
    
    console.log(`🔄 SYNCHRONISATION - Profil utilisateur ${currentUser}`);
    console.log('📊 DONNÉES - Contenu à synchroniser:', userData);
    
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-profile-sync.php`;
    console.log(`🌐 ENDPOINT - Synchronisation avec: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: currentUser, 
        userData,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      console.error(`❌ ERREUR - Synchronisation du profil: ${response.status}`);
      const errorText = await response.text();
      console.error("📝 DÉTAILS - Erreur:", errorText);
      throw new Error(`Échec de la synchronisation: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("✅ SUCCÈS - Résultat synchronisation:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('❌ EXCEPTION - Synchronisation du profil:', error);
    return false;
  }
};

/**
 * Charge les données du profil utilisateur depuis le serveur
 */
export const loadUserProfileFromServer = async (forceUser?: string): Promise<any | null> => {
  try {
    // Récupérer l'utilisateur connecté à la base de données
    const currentUser = forceUser || getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ CHARGEMENT - Aucun utilisateur connecté à la base de données');
      return null;
    }
    
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-profile-load.php`;
    console.log(`🌐 CHARGEMENT - Profil utilisateur ${currentUser} depuis: ${endpoint}`);
    
    const response = await fetch(`${endpoint}?userId=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`❌ ERREUR - Chargement du profil: ${response.status}`);
      throw new Error(`Échec du chargement: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("📥 DONNÉES - Profil chargé:", result);
    
    return result.success ? result.userData : null;
  } catch (error) {
    console.error('❌ EXCEPTION - Chargement du profil:', error);
    return null;
  }
};
