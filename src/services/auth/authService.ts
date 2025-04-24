
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

// Fonction de connexion
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
    
    // Faire un appel API réel au service d'authentification
    const response = await fetch('/api/login-test.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('Réponse du serveur reçue', response.status);
    
    const data = await response.json();
    console.log('Données de réponse:', data);
    
    if (response.ok && data.token) {
      // Stocker les informations d'authentification dans localStorage
      localStorage.setItem('token', data.token);
      
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
