
// Obtenez l'ID de l'utilisateur actuel à partir du localStorage
export const getUserId = (): string | null => {
  return localStorage.getItem('userId');
};

// Utilisez cette fonction pour savoir si un utilisateur est connecté
export const isUserLoggedIn = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Récupérez des informations sur l'utilisateur actuel
export const getUserInfo = (): {id: string | null, role: string | null, username: string | null} => {
  return {
    id: localStorage.getItem('userId'),
    role: localStorage.getItem('userRole'),
    username: localStorage.getItem('username')
  };
};

// Déconnecter l'utilisateur
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
  localStorage.removeItem('isLoggedIn');
};

// Authentification headers pour les requêtes API
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'Cache-Control': 'no-cache'
  };
};

// Interface pour les réponses d'authentification
interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    username?: string;
    nom?: string;
    prenom?: string;
    email?: string;
    identifiant_technique?: string;
    role: string;
  };
  message?: string;
  token?: string;
}

// Obtenir l'URL de l'API à partir de la configuration
const getApiEndpoint = (): string => {
  // Utiliser UNIQUEMENT le chemin relatif pour garantir que l'appel reste sur le même domaine
  // Très important : ne pas utiliser d'URL absolue pour éviter les problèmes CORS
  return '/api';
};

// Fonction de connexion
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
    
    // Définir le bon endpoint API en s'assurant d'utiliser un chemin relatif
    // Nous utilisons uniquement le chemin relatif pour garantir que l'appel reste sur le même domaine
    const loginUrl = `/api/login-test.php`;
    
    console.log(`URL de connexion utilisée: ${loginUrl}`);
    
    // Faire un appel API réel au service d'authentification
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ username, password }),
      // Ajouter ces options pour éviter les problèmes de CORS et de cache
      credentials: 'same-origin',
      mode: 'cors',
    });

    console.log('Réponse du serveur reçue', response.status);
    
    const data = await response.json();
    console.log('Données de réponse:', data);
    
    if (response.ok && data.token) {
      console.log('Login réussi, sauvegarde des informations utilisateur');
      // Stocker les informations d'authentification dans localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('isLoggedIn', 'true');
      
      if (data.user) {
        localStorage.setItem('userId', data.user.id.toString());
        localStorage.setItem('username', data.user.identifiant_technique || data.user.email || data.user.username || '');
        localStorage.setItem('userRole', data.user.role || 'utilisateur');
      }
      
      return {
        success: true,
        user: data.user,
        token: data.token
      };
    } else {
      console.error('Erreur de connexion:', data.message || 'Identifiants invalides');
      return {
        success: false,
        message: data.message || 'Identifiants invalides'
      };
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la tentative de connexion'
    };
  }
};
