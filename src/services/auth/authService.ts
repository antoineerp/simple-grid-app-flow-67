
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
    username: string;
    role: string;
  };
  message?: string;
  token?: string;
}

// Fonction de connexion
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
    
    // Simulation d'une réponse API réussie pour les tests
    // Dans une vraie implémentation, nous ferions un appel API ici
    const mockUsers = [
      { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
      { id: '2', username: 'user', password: 'user123', role: 'user' },
      { id: '3', username: 'essai@essai.com', password: 'essai123', role: 'gestionnaire' },
      { id: '4', username: 'antcirier@gmail.com', password: 'password123', role: 'admin' },
    ];

    const user = mockUsers.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      throw new Error("Nom d'utilisateur ou mot de passe invalide");
    }

    // Générer un token simple pour démonstration
    const token = `mock-jwt-token-${Date.now()}-${username}`;
    
    // Stocker les informations d'authentification dans localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('username', user.username);
    localStorage.setItem('userRole', user.role);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token
    };
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la tentative de connexion'
    };
  }
};
