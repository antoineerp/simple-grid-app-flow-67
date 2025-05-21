
import { getApiUrl } from '@/config/apiConfig';
import { User, AuthResponse } from '@/types/auth';
import { setCurrentUser as setDbUser } from '@/services/core/databaseConnectionService';

export const getCurrentUser = (): User | null => {
  const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  if (!token) return null;

  try {
    // Vérification plus robuste du format du token
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.error("Format de token invalide:", token);
      return null;
    }
    
    // Extraire la partie payload (deuxième partie du token)
    const parts = token.split('.');
    const payloadBase64 = parts[1];
    
    // Préparation pour le décodage base64
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    
    // Décodage plus sûr avec try/catch
    try {
      const jsonPayload = atob(paddedBase64);
      const userData = JSON.parse(jsonPayload);
      
      // Synchroniser avec le service de base de données
      if (userData.user && typeof userData.user === 'string') {
        setDbUser(userData.user);
      }
      
      // Stocker le rôle dans le localStorage pour faciliter l'accès
      if (userData.role) {
        localStorage.setItem('userRole', userData.role);
      }
      
      // Retourne l'identifiant technique comme une propriété id
      return userData.user ? { id: userData.user } : null;
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
      // Vérifier que le token a bien le format d'un JWT (contient exactement deux points)
      if (data.token.split('.').length === 3) {
        // Test de décodage pour vérifier que le token est valide
        try {
          const parts = data.token.split('.');
          const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const pad = base64Payload.length % 4;
          const paddedBase64 = pad ? base64Payload + '='.repeat(4 - pad) : base64Payload;
          
          const decodedPayload = JSON.parse(atob(paddedBase64));
          
          if (!decodedPayload || !decodedPayload.user) {
            console.error("Décodage du token réussi mais structure invalide:", decodedPayload);
            return {
              success: false,
              message: "Le token reçu du serveur a une structure invalide"
            };
          }
          
          // Token validé, on peut le sauvegarder
          sessionStorage.setItem('authToken', data.token);
          localStorage.setItem('authToken', data.token);
          
          // Sauvegarder l'identifiant utilisateur
          if (decodedPayload.user && typeof decodedPayload.user === 'string') {
            const userTechId = decodedPayload.user;
            localStorage.setItem('userId', userTechId);
            sessionStorage.setItem('userId', userTechId);
            setDbUser(userTechId);
            console.log(`ID technique de l'utilisateur sauvegardé: ${userTechId}`);
          }
          
          // Stocker explicitement le rôle utilisateur
          if (decodedPayload.role) {
            localStorage.setItem('userRole', decodedPayload.role);
          }
          
          return { 
            success: true, 
            token: data.token,
            user: decodedPayload.user || null,
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
    if (!payload || !payload.user || typeof payload.user !== 'string') {
      console.warn("Aucun ID utilisateur dans le payload du token");
      return null;
    }
    
    // Synchroniser l'identifiant avec le service de base de données
    const userId = payload.user;
    setDbUser(userId);
    console.log(`Identifiant utilisateur synchronisé depuis le token: ${userId}`);
    
    return userId;
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'identifiant utilisateur:", error);
    return null;
  }
}
