
export interface User {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive';
  last_login?: string;
  created_at?: string;
}

export interface Utilisateur {
  id: string | number;
  username: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive';
  last_login?: string;
  created_at?: string;
  
  // Additional properties used in the app
  nom?: string;
  prenom?: string;
  identifiant_technique?: string;
  mot_de_passe?: string;
  date_creation?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: Utilisateur;
  message?: string;
  user_id?: string;
}
