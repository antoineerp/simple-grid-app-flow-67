
import { getApiUrl } from '@/config/apiConfig';
import { User, AuthResponse } from '@/types/auth';
import { setCurrentUser as setDbUser } from '@/services/core/databaseConnectionService';

export const getCurrentUser = (): User | null => {
  const token = sessionStorage.getItem('authToken');
  if (!token) return null;

  try {
    // Vérification plus robuste du format du token
    if (!token.includes('.')) {
      console.error("Format de token invalide (ne contient pas de points):", token);
      return null;
    }
    
    // Extraire la partie payload (deuxième partie du token)
    const parts = token.split('.');
    
    // Si le token n'a pas au moins 2 parties, c'est invalide
    if (parts.length < 2) {
      console.error("Format de token invalide (moins de 2 parties):", token);
      return null;
    }
    
    const payloadBase64 = parts[1];
    if (!payloadBase64) {
      console.error("Payload du token manquant:", token);
      return null;
    }
    
    // Assurons-nous que le padding est correct pour le décodage base64
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    
    // Décodage plus sûr avec try/catch
    try {
      const rawPayload = atob(base64);
      const jsonPayload = decodeURIComponent(
        Array.from(rawPayload)
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const userData = JSON.parse(jsonPayload);
      
      // Synchroniser avec le service de base de données
      if (userData.user && userData.user.identifiant_technique) {
        setDbUser(userData.user.identifiant_technique);
      }
      
      return userData.user || null;
    } catch (decodeError) {
      console.error("Erreur lors du décodage du payload:", decodeError);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la décodage du token:", error);
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken');
};

export const getIsLoggedIn = (): boolean => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user && user.identifiant_technique);
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
    console.log(`Tentative de connexion à: ${API_URL}/auth.php avec l'utilisateur: ${username}`);
    
    const response = await fetch(`${API_URL}/auth.php`, {
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
      // Vérifier que le token a bien le format d'un JWT (contient au moins deux points)
      if (data.token.includes('.') && data.token.split('.').length >= 2) {
        // Ajout d'un test de décodage pour vérifier que le token est vraiment valide
        try {
          const parts = data.token.split('.');
          const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const decodedPayload = JSON.parse(atob(base64Payload));
          
          if (!decodedPayload || !decodedPayload.user) {
            console.error("Décodage du token réussi mais structure invalide:", decodedPayload);
            return {
              success: false,
              message: "Le token reçu du serveur a une structure invalide"
            };
          }
          
          // Token validé, on peut le sauvegarder
          sessionStorage.setItem('authToken', data.token);
          
          // Initialiser l'utilisateur courant pour la base de données
          if (data.user && data.user.identifiant_technique) {
            setDbUser(data.user.identifiant_technique);
          }
          
          return { 
            success: true, 
            token: data.token,
            user: data.user || null,
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
          message: "Le format du token reçu est invalide"
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
};
