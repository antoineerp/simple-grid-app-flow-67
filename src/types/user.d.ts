
export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  mot_de_passe?: string;
  role: 'administrateur' | 'utilisateur' | 'gestionnaire';
  date_creation?: Date;
  date_modification?: Date;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  user: Utilisateur | null;
  loading: boolean;
  error: string | null;
}

export interface AuthError {
  message: string;
  code?: string;
  details?: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Utilisateur;
  error?: AuthError;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData extends LoginCredentials {
  nom: string;
  prenom: string;
  confirmPassword: string;
}
