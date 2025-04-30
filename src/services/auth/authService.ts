
import { User } from '@/types/auth';

/**
 * Obtenir l'utilisateur actuellement connecté
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur est connecté
 */
export function getIsLoggedIn(): boolean {
  return !!localStorage.getItem('token') && !!localStorage.getItem('user');
}

/**
 * Obtenir le token d'authentification
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Obtenir les en-têtes pour les requêtes API avec authentification
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
}

/**
 * Se déconnecter et effacer les données d'authentification
 */
export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
}

/**
 * Mettre à jour les données utilisateur localement
 */
export function updateUserData(userData: Partial<User>): boolean {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    if (userData.role) {
      localStorage.setItem('userRole', userData.role);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données utilisateur:', error);
    return false;
  }
}
