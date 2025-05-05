
// Constantes
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';
const IS_LOGGED_IN = 'isLoggedIn';
const USER_ROLE = 'userRole';

// Interface pour le résultat de login
export interface LoginResult {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
  error?: any;
}

// Interface pour un utilisateur
export interface User {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Tente de connecter un utilisateur avec ses identifiants
 */
export const login = async (username: string, password: string): Promise<LoginResult> => {
  try {
    // Simulation de login pour le moment
    console.log(`Tentative de connexion pour l'utilisateur: ${username}`);

    // Logique de connexion réelle serait implémentée ici
    // Pour l'instant, on simule une connexion réussie
    const user = {
      id: '1',
      username,
      email: `${username}@example.com`,
      role: 'user'
    };

    // Stocker les infos de session
    localStorage.setItem(TOKEN_KEY, 'fake-jwt-token');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(IS_LOGGED_IN, 'true');
    localStorage.setItem(USER_ROLE, user.role);

    return {
      success: true,
      token: 'fake-jwt-token',
      user
    };
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion',
      error
    };
  }
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.setItem(IS_LOGGED_IN, 'false');
  localStorage.removeItem(USER_ROLE);
};

/**
 * Vérifie si un utilisateur est connecté
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem(IS_LOGGED_IN) === 'true';
};

/**
 * Récupère le token d'authentification
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Récupère l'utilisateur actuel
 */
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return null;
  }
};

/**
 * Récupère le rôle de l'utilisateur
 */
export const getUserRole = (): string | null => {
  return localStorage.getItem(USER_ROLE);
};

/**
 * Sauvegarde le token dans le stockage local
 */
export const saveToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};
