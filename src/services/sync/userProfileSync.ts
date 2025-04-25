
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/hooks/use-toast';

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
        'X-Request-ID': requestId,
        'X-Client-Source': 'react-app'
      },
      body: JSON.stringify({ 
        userId: currentUser, 
        userData,
        timestamp: new Date().toISOString(),
        requestId
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
    
    // Notifier l'utilisateur
    toast({
      title: "Profil synchronisé",
      description: "Vos données ont été enregistrées sur le serveur",
      variant: "default"
    });
    
    return result.success === true;
  } catch (error) {
    console.error('❌ EXCEPTION - Synchronisation du profil:', error);
    
    // Notifier l'utilisateur de l'échec
    toast({
      title: "Échec de synchronisation",
      description: "Impossible d'enregistrer vos données sur le serveur",
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
    
    // Normaliser l'identifiant utilisateur pour correspondre au format côté serveur
    const normalizedUserId = currentUser.toLowerCase();
    console.log(`🔑 UTILISATEUR - ID normalisé: ${normalizedUserId}`);
    
    const response = await fetch(`${endpoint}?userId=${encodeURIComponent(normalizedUserId)}&requestId=${requestId}`, {
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
    
    if (result.success && Object.keys(result.userData).length > 0) {
      toast({
        title: "Profil chargé",
        description: "Vos données ont été récupérées depuis le serveur",
        variant: "default"
      });
    }
    
    return result.success ? result.userData : null;
  } catch (error) {
    console.error('❌ EXCEPTION - Chargement du profil:', error);
    
    toast({
      title: "Échec de chargement",
      description: "Impossible de récupérer vos données depuis le serveur",
      variant: "destructive"
    });
    
    return null;
  }
};

// Fonction pour recharger explicitement le profil utilisateur
export const forceReloadUserProfile = async (): Promise<any> => {
  console.log('🔄 RECHARGEMENT FORCÉ - Demande de rechargement du profil utilisateur');
  return await loadUserProfileFromServer();
};
