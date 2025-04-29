
export interface User {
  id?: string; // Changé de number/string à string pour correspondre au varchar(36)
  username?: string;
  identifiant_technique?: string;
  email?: string;
  role?: 'administrateur' | 'utilisateur' | 'gestionnaire'; // Limité aux valeurs exactes de l'enum
  nom?: string;
  prenom?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}
