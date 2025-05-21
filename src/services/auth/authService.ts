import { getApiUrl } from '@/config/apiConfig';
import { User, AuthResponse } from '@/types/auth';
import { setCurrentUser as setDbUser } from '@/services/core/databaseConnectionService';

// Liste des IDs système à bloquer
const SYSTEM_IDS = ['p71x6d_system2', 'p71x6d_system'];
const DEFAULT_SAFE_ID = 'p71x6d_richard';

/**
 * Assure que l'ID utilisateur est extrait du token JWT et retourné
 * Cette fonction ne modifie aucun stockage
 */
export const ensureUserIdFromToken = (): string | null => {
  const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  if (!token) return null;

  try {
    // Vérification du format du token
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.error("Format de token invalide:", token);
      return null;
    }
    
    // Extraire la partie payload du token
    const parts = token.split('.');
    const payloadBase64 = parts[1];
    
    // Préparation pour le décodage base64
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    
    try {
      const jsonPayload = atob(paddedBase64);
      const userData = JSON.parse(jsonPayload);
      
      // Si userData.user est un objet, extraire l'identifiant_technique
      if (userData.user) {
        const userId = typeof userData.user === 'object' && userData.user.identifiant_technique 
          ? userData.user.identifiant_technique 
          : (typeof userData.user === 'string' ? userData.user : null);
          
        if (userId) {
          // Bloquer les IDs système problématiques
          if (SYSTEM_IDS.includes(userId)) {
            console.warn(`ID système problématique détecté dans le token: ${userId}`);
            return DEFAULT_SAFE_ID;
          }
          
          return userId;
        }
      }
      
      return null;
    } catch (decodeError) {
      console.error("Erreur lors du décodage du payload:", decodeError);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
    return null;
  }
};

/**
 * Récupère l'utilisateur actuel à partir du token d'authentification
 * et met à jour les stockages si nécessaire
 */
export const getCurrentUser = (): string | null => {
  const userId = ensureUserIdFromToken();
  
  if (userId) {
    // Bloquer les IDs système problématiques
    if (SYSTEM_IDS.includes(userId)) {
      console.warn(`ID système problématique détecté: ${userId}`);
      
      // Utiliser un ID sûr à la place
      setDbUser(DEFAULT_SAFE_ID);
      localStorage.setItem('userId', DEFAULT_SAFE_ID);
      sessionStorage.setItem('userId', DEFAULT_SAFE_ID);
      
      return DEFAULT_SAFE_ID;
    }
    
    // Synchroniser avec le service de base de données
    setDbUser(userId);
    localStorage.setItem('userId', userId);
    sessionStorage.setItem('userId', userId);
    
    return userId;
  }
  
  return null;
};

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
};

export const getIsLoggedIn = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

/**
 * Fonction d'authentification
 */
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Tentative de connexion à: ${API_URL}/check-users.php avec l'utilisateur: ${username}`);
    
    const response = await fetch(`${API_URL}/check-users.php`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache' 
      },
      body: JSON.stringify({ username, password })
    });

    const responseText = await response.text();
    
    // Tenter de parser la réponse en JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erreur lors du parsing de la réponse JSON:', parseError);
      console.error('Réponse brute:', responseText.substring(0, 500));
      
      if (responseText.includes('env.php') || responseText.includes('Failed to open stream')) {
        return { 
          success: false, 
          message: "Erreur de configuration du serveur: Fichier env.php manquant" 
        };
      }
      
      return { 
        success: false, 
        message: `Erreur dans la réponse JSON: ${parseError}. Réponse reçue: ${responseText.substring(0, 100)}...` 
      };
    }

    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status}`);
      return { 
        success: false, 
        message: data.message || `Erreur serveur: ${response.status} ${response.statusText}` 
      };
    }
    
    console.log('Réponse de l\'authentification:', data);
    
    if (data.token) {
      // Nettoyer les anciennes données d'abord
      localStorage.removeItem('userId');
      sessionStorage.removeItem('userId');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      // Vérifier que le token a bien le format d'un JWT
      if (data.token.split('.').length === 3) {
        // Test de décodage pour vérifier que le token est valide
        try {
          const parts = data.token.split('.');
          const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const pad = base64Payload.length % 4;
          const paddedBase64 = pad ? base64Payload + '='.repeat(4 - pad) : base64Payload;
          
          const decodedPayload = JSON.parse(atob(paddedBase64));
          
          if (!decodedPayload) {
            return {
              success: false,
              message: "Le token reçu du serveur a une structure invalide"
            };
          }
          
          // Extraire l'identifiant utilisateur
          let userId = null;
          
          // Extraction selon différents formats possibles
          if (decodedPayload.user) {
            if (typeof decodedPayload.user === 'object' && decodedPayload.user.identifiant_technique) {
              userId = decodedPayload.user.identifiant_technique;
            } else if (typeof decodedPayload.user === 'string') {
              userId = decodedPayload.user;
            }
          }
          
          if (!userId) {
            return {
              success: false,
              message: "Identifiant utilisateur manquant dans le token"
            };
          }
          
          // Bloquer les IDs système problématiques
          if (SYSTEM_IDS.includes(userId)) {
            console.warn(`Tentative de connexion avec ID système bloqué: ${userId}`);
            userId = DEFAULT_SAFE_ID;
          }
          
          // Token validé, on peut le sauvegarder
          sessionStorage.setItem('authToken', data.token);
          localStorage.setItem('authToken', data.token);
          
          // Sauvegarder l'identifiant utilisateur
          localStorage.setItem('userId', userId);
          sessionStorage.setItem('userId', userId);
          setDbUser(userId);
          
          return {
            success: true,
            message: "Connexion réussie",
            token: data.token,
            user: {
              ...data.user,
              id: userId
            }
          };
        } catch (tokenError) {
          console.error("Erreur lors de la validation du token:", tokenError);
          return {
            success: false,
            message: "Erreur lors de la validation du token d'authentification"
          };
        }
      } else {
        return {
          success: false,
          message: "Le format du token d'authentification est invalide"
        };
      }
    }
    
    return {
      success: false,
      message: data.message || "Échec de l'authentification: réponse invalide du serveur"
    };
  } catch (error) {
    console.error('Erreur lors de la tentative de connexion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue lors de la connexion"
    };
  }
};

export const logout = () => {
  // Nettoyer les données spécifiques à l'utilisateur dans le localStorage
  const userId = getCurrentUser();
  const keysToRemove = [];
  
  // Récupérer toutes les clés à supprimer
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Supprimer les clés spécifiques à cet utilisateur
    if (key && userId && key.includes(userId)) {
      keysToRemove.push(key);
    }
    // Supprimer aussi les clés génériques d'authentification
    if (key && (key === 'authToken' || key === 'userId' || key === 'userRole')) {
      keysToRemove.push(key);
    }
  }
  
  // Supprimer les clés
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Nettoyer aussi le sessionStorage
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userRole');
  
  console.log(`Déconnexion effectuée, ${keysToRemove.length} clés de stockage nettoyées`);
  
  // Rediriger vers la page de connexion
  window.location.href = '/';
};

/**
 * Fonction pour détecter et corriger l'ID utilisateur s'il est incorrect
 */
export const sanitizeUserId = (userId: string): string => {
  // Vérifier si c'est l'ID système problématique
  if (userId === 'p71x6d_system2' && !sessionStorage.getItem('force_system2')) {
    console.warn("ID système détecté, tentative de correction");
    
    // Tenter de récupérer un ID valide depuis le token
    const tokenId = ensureUserIdFromToken();
    if (tokenId && tokenId !== 'p71x6d_system2') {
      console.log(`ID corrigé depuis le token: ${tokenId}`);
      return tokenId;
    }
    
    // Si pas d'ID valide dans le token, utiliser l'ID de secours
    return 'p71x6d_richard';
  }
  
  return userId;
}
