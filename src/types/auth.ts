
/**
 * Interface pour les utilisateurs authentifiés
 */
export interface User {
  id: string;
  identifiant_technique?: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  date_creation?: string;
  date_modification?: string;
}

/**
 * Interface pour les rôles d'utilisateurs
 */
export enum UserRoles {
  ADMIN = 'admin',
  ADMINISTRATEUR = 'administrateur',
  GESTIONNAIRE = 'gestionnaire',
  UTILISATEUR = 'utilisateur',
}

/**
 * Interface pour la réponse d'authentification
 */
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

/**
 * Interface pour les erreurs d'authentification
 */
export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}
