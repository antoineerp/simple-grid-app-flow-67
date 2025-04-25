
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
    
    // Ajouter un identifiant unique à la requête pour détecter les doublons
    const requestId = `req_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`🔑 REQUEST_ID - Identifiant unique: ${requestId}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,  // Ajouter l'ID unique dans les en-têtes
        'X-Client-Source': 'react-app'
      },
      body: JSON.stringify({ 
        userId: currentUser, 
        userData,
        timestamp: new Date().toISOString(),
        requestId // Inclure également l'ID dans les données pour le traçage côté serveur
      })
    });
    
    // Enregistrer les détails de la réponse pour détecter d'éventuels problèmes
    console.log(`📥 RÉPONSE - Status: ${response.status} ${response.statusText}`);
    console.log(`📥 RÉPONSE - Headers:`, Object.fromEntries(response.headers.entries()));
    
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
    
    // Ajouter un identifiant unique à la requête pour détecter les doublons
    const requestId = `req_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`🔑 REQUEST_ID - Identifiant unique pour chargement: ${requestId}`);
    console.log(`🌐 CHARGEMENT - Profil utilisateur ${currentUser} depuis: ${endpoint}?userId=${encodeURIComponent(currentUser)}`);
    
    const response = await fetch(`${endpoint}?userId=${encodeURIComponent(currentUser)}&requestId=${requestId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'X-Request-ID': requestId,
        'X-Client-Source': 'react-app'
      }
    });
    
    // Enregistrer les détails de la réponse pour détecter d'éventuels problèmes
    console.log(`📥 RÉPONSE CHARGEMENT - Status: ${response.status} ${response.statusText}`);
    console.log(`📥 RÉPONSE CHARGEMENT - Headers:`, Object.fromEntries(response.headers.entries()));
    
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
