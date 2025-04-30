
import { Utilisateur } from '../users/types';

// Token storage keys
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';
const ROLE_KEY = 'userRole';

/**
 * Fonction de connexion - envoie les identifiants au serveur et traite la réponse
 */
export const login = async (username: string, password: string): Promise<{
  success: boolean;
  token?: string;
  message?: string;
  user?: Utilisateur;
}> => {
  try {
    // Simuler une connexion réussie pour le développement
    console.log("Tentative de connexion avec:", username);
    
    // Dans une implémentation réelle, vous appelleriez votre API ici
    // const response = await fetch(`${getApiUrl()}/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password })
    // });
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Pour les tests, accepter toute connexion
    const user: Utilisateur = {
      id: '1',
      identifiant_technique: 'p71x6d_' + username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      email: username,
      nom: 'Utilisateur',
      prenom: 'Test',
      role: 'admin',
      actif: true,
      derniere_connexion: new Date().toISOString(),
      date_creation: new Date().toISOString(),
      mot_de_passe: password
    };
    
    // Générer un token factice
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ 
      userId: user.id, 
      email: user.email
    }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
    
    // Stocker les données d'authentification
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(ROLE_KEY, user.role || 'utilisateur');
    
    return {
      success: true,
      token,
      user
    };
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la connexion"
    };
  }
};

/**
 * Vérifier si l'utilisateur est connecté
 */
export const getIsLoggedIn = (): boolean => {
  return !!localStorage.getItem(TOKEN_KEY);
};

/**
 * Récupérer l'utilisateur actuel
 */
export const getCurrentUser = (): Utilisateur | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson) as Utilisateur;
  } catch {
    return null;
  }
};

/**
 * Récupérer le token d'authentification
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Récupérer les en-têtes d'authentification pour les requêtes API
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Déconnexion - supprimer toutes les données d'authentification
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
  
  // Déclencher un événement pour informer l'application de la déconnexion
  window.dispatchEvent(new CustomEvent('user-logout'));
};

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 */
export const hasRole = (requiredRole: string | string[]): boolean => {
  const userRole = localStorage.getItem(ROLE_KEY);
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
};
