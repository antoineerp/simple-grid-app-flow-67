
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/hooks/use-toast';

/**
 * Détecte si le contenu de la réponse est du code PHP et non du JSON
 */
const isPhpContent = (text: string): boolean => {
  return text.trim().startsWith('<?php') || text.includes('<?php');
};

/**
 * Vérifie si la réponse du serveur est valide
 */
const validateApiResponse = async (response: Response): Promise<any> => {
  // Récupérer le texte brut de la réponse
  const responseText = await response.text();
  
  // Vérifier si le contenu est du code PHP
  if (isPhpContent(responseText)) {
    console.error('❌ ERREUR - Le serveur a retourné du code PHP au lieu de JSON:', responseText.substring(0, 200));
    throw new Error('Configuration serveur incorrecte: PHP n\'est pas exécuté correctement');
  }
  
  // Essayer de parser le JSON
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('❌ ERREUR - Réponse non JSON:', responseText);
    throw new Error(`Réponse invalide du serveur: Impossible de parser le JSON`);
  }
};

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
    
    // Vérifier le content-type
    const contentType = response.headers.get('content-type');
    console.log(`📥 RÉPONSE - Content-Type: ${contentType}`);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`⚠️ ATTENTION - Content-Type non JSON: ${contentType}`);
    }
    
    // Utiliser la fonction de validation pour obtenir le JSON ou gérer l'erreur
    const result = await validateApiResponse(response);
    
    // Vérifier si la clé php_check existe dans la réponse
    if (result.php_check) {
      console.log(`✅ PHP s'exécute correctement sur le serveur. Timestamp: ${new Date(result.php_check.timestamp * 1000).toISOString()}`);
    } else {
      console.warn(`⚠️ ATTENTION - Aucune confirmation d'exécution PHP dans la réponse`);
    }
    
    if (result.success === true) {
      console.log("✅ SUCCÈS - Résultat synchronisation:", result);
      
      // Notifier l'utilisateur
      toast({
        title: "Profil synchronisé",
        description: "Vos données ont été enregistrées sur le serveur",
        variant: "default"
      });
    } else {
      console.error("❌ ERREUR - Échec de la synchronisation:", result);
      throw new Error(result.message || "Échec de la synchronisation");
    }
    
    return result.success === true;
  } catch (error) {
    console.error('❌ EXCEPTION - Synchronisation du profil:', error);
    
    // Message d'erreur plus spécifique
    let errorMessage = "Impossible d'enregistrer vos données sur le serveur";
    
    if (error instanceof Error) {
      if (error.message.includes('PHP n\'est pas exécuté')) {
        errorMessage = "Erreur de configuration serveur: PHP n'est pas exécuté correctement";
      } else if (error.message.includes('Impossible de parser le JSON')) {
        errorMessage = "Erreur serveur: réponse invalide";
      }
    }
    
    // Notifier l'utilisateur de l'échec
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
    
    // Normaliser l'identifiant utilisateur pour correspondre au format côté serveur
    const normalizedUserId = currentUser.toLowerCase();
    console.log(`🔑 UTILISATEUR - ID normalisé: ${normalizedUserId}`);
    console.log(`🌐 CHARGEMENT - Profil utilisateur depuis: ${endpoint}?userId=${encodeURIComponent(normalizedUserId)}`);
    
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
    
    // Vérifier le content-type
    const contentType = response.headers.get('content-type');
    console.log(`📥 RÉPONSE - Content-Type: ${contentType}`);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`⚠️ ATTENTION - Content-Type non JSON: ${contentType}`);
    }
    
    // Utiliser la fonction de validation pour obtenir le JSON ou gérer l'erreur
    const result = await validateApiResponse(response);
    
    // Vérifier si la clé php_check existe dans la réponse
    if (result.php_check) {
      console.log(`✅ PHP s'exécute correctement sur le serveur. Timestamp: ${new Date(result.php_check.timestamp * 1000).toISOString()}`);
    } else {
      console.warn(`⚠️ ATTENTION - Aucune confirmation d'exécution PHP dans la réponse`);
    }
    
    if (result.success && Object.keys(result.userData || {}).length > 0) {
      console.log("📥 DONNÉES - Profil chargé:", result);
      
      toast({
        title: "Profil chargé",
        description: "Vos données ont été récupérées depuis le serveur",
        variant: "default"
      });
    } else {
      console.log("ℹ️ INFO - Aucune donnée ou profil vide:", result);
    }
    
    return result.success ? result.userData : null;
  } catch (error) {
    console.error('❌ EXCEPTION - Chargement du profil:', error);
    
    // Message d'erreur plus spécifique
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

// Fonction pour recharger explicitement le profil utilisateur
export const forceReloadUserProfile = async (): Promise<any> => {
  console.log('🔄 RECHARGEMENT FORCÉ - Demande de rechargement du profil utilisateur');
  return await loadUserProfileFromServer();
};

/**
 * Fonction utilitaire pour diagnostiquer l'API
 */
export const diagnoseApiConnection = async (): Promise<{
  success: boolean;
  details: any;
}> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-profile-load.php`;
    const requestId = `diag_${new Date().getTime()}`;
    
    console.log(`🔍 DIAGNOSTIC - Connexion à: ${endpoint}`);
    
    const response = await fetch(`${endpoint}?test=1&requestId=${requestId}`, {
      method: 'GET',
      headers: {
        'X-Request-ID': requestId,
        'X-Client-Source': 'react-app-diagnostic'
      }
    });
    
    // Récupérer le texte brut pour analyse
    const responseText = await response.text();
    
    const diagnosticResult = {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type') || 'non spécifié',
      isPhp: isPhpContent(responseText),
      firstChars: responseText.substring(0, 50).replace(/\n/g, '\\n'),
      headers: Object.fromEntries(response.headers.entries())
    };
    
    console.log('🔍 DIAGNOSTIC - Résultat:', diagnosticResult);
    
    if (diagnosticResult.isPhp) {
      return {
        success: false,
        details: {
          ...diagnosticResult,
          message: "PHP n'est pas correctement exécuté sur le serveur",
          tip: "Vérifiez la configuration PHP sur votre serveur."
        }
      };
    }
    
    // Tenter de parser le JSON (si possible)
    try {
      const jsonResult = JSON.parse(responseText);
      return {
        success: jsonResult.php_check ? true : false,
        details: {
          ...diagnosticResult,
          jsonParsed: true,
          phpExecution: jsonResult.php_check ? true : false,
          response: jsonResult
        }
      };
    } catch (jsonError) {
      return {
        success: false,
        details: {
          ...diagnosticResult,
          jsonParsed: false,
          jsonError: (jsonError as Error).message,
          message: "La réponse n'est pas un JSON valide"
        }
      };
    }
  } catch (error) {
    console.error('❌ DIAGNOSTIC - Erreur:', error);
    return {
      success: false,
      details: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        message: "Impossible de contacter l'API"
      }
    };
  }
};

// Nouvelle fonction pour vérifier l'état du serveur PHP de manière détaillée
export const checkPhpServerStatus = async (): Promise<{
  isWorking: boolean;
  detail: string;
  errorCode?: string;
}> => {
  try {
    const result = await diagnoseApiConnection();
    
    if (result.success) {
      return {
        isWorking: true,
        detail: "Le serveur PHP fonctionne correctement"
      };
    }
    
    if (result.details?.isPhp) {
      return {
        isWorking: false,
        detail: "Le serveur retourne le code PHP au lieu de l'exécuter",
        errorCode: "PHP_EXECUTION_ERROR"
      };
    }
    
    if (!result.details?.jsonParsed) {
      return {
        isWorking: false,
        detail: "Le serveur ne renvoie pas de JSON valide",
        errorCode: "INVALID_JSON"
      };
    }
    
    return {
      isWorking: false,
      detail: result.details?.message || "Problème de configuration du serveur",
      errorCode: "SERVER_CONFIG_ERROR"
    };
  } catch (error) {
    return {
      isWorking: false,
      detail: error instanceof Error ? error.message : "Erreur inconnue",
      errorCode: "CONNECTION_ERROR"
    };
  }
};
