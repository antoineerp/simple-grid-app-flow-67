
// Types pour l'authentification et les utilisateurs

export type UserRole = 'admin' | 'gestionnaire' | 'utilisateur';

export interface Utilisateur {
  id: number | string;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: UserRole;
  date_creation?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number | string;
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    identifiant_technique: string;
  };
}

export interface AuthState {
  isLoggedIn: boolean;
  currentUser: Utilisateur | null;
  currentDatabaseUser: string | null;
  error: string | null;
}
