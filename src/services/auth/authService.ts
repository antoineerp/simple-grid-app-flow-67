import { getApiUrl } from '@/config/apiConfig';
import { User, AuthResponse } from '@/types/auth';
import { setCurrentUser as setDbUser } from '@/services/core/databaseConnectionService';

/**
 * Récupère l'utilisateur actuel à partir du token d'authentification
 */
export const getCurrentUser = (): string | null => {
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
      
      console.log("Données utilisateur extraites du token:", userData);
      
      // Synchroniser avec le service de base de données
      if (userData.user) {
        // Si userData.user est un objet, extraire l'identifiant_technique
        const userId = typeof userData.user === 'object' && userData.user.identifiant_technique 
          ? userData.user.identifiant_technique 
          : (typeof userData.user === 'string' ? userData.user : null);
          
        if (userId) {
          // Synchroniser l'ID utilisateur avec le service de base de données
          setDbUser(userId);
          
          // Stocker l'ID utilisateur dans le localStorage pour un accès plus facile
          localStorage.setItem('userId', userId);
          sessionStorage.setItem('userId', userId);
          
          // Stocker le rôle dans le localStorage pour faciliter l'accès
          if (userData.role) {
            localStorage.setItem('userRole', userData.role);
          }
          
          console.log(`ID utilisateur extrait et synchronisé: ${userId}`);
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
      // Vérifier que le token a bien le format d'un JWT
      if (data.token.split('.').length === 3) {
        // Test de décodage pour vérifier que le token est valide
        try {
          const parts = data.token.split('.');
          const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const pad = base64Payload.length % 4;
          const paddedBase64 = pad ? base64Payload + '='.repeat(4 - pad) : base64Payload;
          
          const decodedPayload = JSON.parse(atob(paddedBase64));
          console.log("Token décodé:", decodedPayload);
          
          if (!decodedPayload) {
            console.error("Décodage du token réussi mais structure invalide:", decodedPayload);
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
              console.log(`ID technique extrait du token (objet): ${userId}`);
            } else if (typeof decodedPayload.user === 'string') {
              userId = decodedPayload.user;
              console.log(`ID technique extrait du token (string): ${userId}`);
            }
          }
          
          if (!userId) {
            console.error("ID utilisateur non trouvé dans le token");
            return {
              success: false,
              message: "Identifiant utilisateur manquant dans le token"
            };
          }
          
          // Token validé, on peut le sauvegarder
          sessionStorage.setItem('authToken', data.token);
          localStorage.setItem('authToken', data.token);
          
          // Sauvegarder l'identifiant utilisateur
          localStorage.setItem('userId', userId);
          sessionStorage.setItem('userId', userId);
          setDbUser(userId);
          console.log(`ID technique de l'utilisateur sauvegardé: ${userId}`);
          
          // Stocker explicitement le rôle utilisateur
          if (decodedPayload.role) {
            localStorage.setItem('userRole', decodedPayload.role);
          }
          
          // Extraire les informations utilisateur
          const user = data.user ? {
            id: userId,
            ...data.user
          } : { id: userId };
          
          // Déclencher un événement pour informer l'application du changement d'utilisateur
          window.dispatchEvent(new CustomEvent('userChanged', { 
            detail: { userId } 
          }));
          
          return { 
            success: true, 
            token: data.token,
            user: user,
            message: data.message || 'Connexion réussie'
          };
        } catch (decodeError) {
          console.error("Token de format invalide reçu:", data.token);
          console.error("Erreur lors du décodage:", decodeError);
          return {
            success: false,
            message: "Le format du token reçu est invalide"
          };
        }
      } else {
        console.error("Token de format invalide reçu:", data.token);
        return {
          success: false,
          message: "Le format du token reçu est invalide (doit contenir 3 parties)"
        };
      }
    }
    
    return { 
      success: false, 
      message: data.message || data.error || 'Identifiants invalides' 
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur lors de la connexion' 
    };
  }
};

export const logout = () => {
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  sessionStorage.removeItem('userId');
  
  // Nettoyer les données spécifiques à l'utilisateur dans le localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('_p71x6d_'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`Déconnexion effectuée, ${keysToRemove.length} clés de stockage nettoyées`);
  
  // Rediriger vers la page de connexion
  window.location.href = '/';
};

/**
 * Récupère l'identifiant technique de l'utilisateur connecté 
 * à partir du token JWT et assure qu'il est synchronisé
 */
export const ensureUserIdFromToken = (): string | null => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("Aucun token d'authentification trouvé");
      return null;
    }
    
    // Décodage du token JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("Format de token invalide");
      return null;
    }
    
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64Payload.length % 4;
    const paddedBase64 = pad ? base64Payload + '='.repeat(4 - pad) : base64Payload;
    
    const payload = JSON.parse(atob(paddedBase64));
    console.log("Payload du token lors de l'extraction de l'ID:", payload);
    
    // Extraction selon différents formats possibles
    let userId = null;
    
    if (payload && payload.user) {
      if (typeof payload.user === 'object' && payload.user.identifiant_technique) {
        userId = payload.user.identifiant_technique;
        console.log(`ID utilisateur extrait du token (format objet): ${userId}`);
      } else if (typeof payload.user === 'string') {
        userId = payload.user;
        console.log(`ID utilisateur extrait du token (format string): ${userId}`);
      }
    }
    
    if (!userId) {
      console.warn("Aucun ID utilisateur dans le payload du token");
      return null;
    }
    
    // Synchroniser l'identifiant avec le service de base de données
    setDbUser(userId);
    
    // Mettre à jour le stockage local
    localStorage.setItem('userId', userId);
    sessionStorage.setItem('userId', userId);
    
    console.log(`Identifiant utilisateur synchronisé depuis le token: ${userId}`);
    
    return userId;
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'identifiant utilisateur:", error);
    return null;
  }
}
