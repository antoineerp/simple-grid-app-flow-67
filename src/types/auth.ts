
export interface User {
  id?: string;
  username?: string;
  identifiant_technique?: string;
  email?: string;
  role?: string;
  nom?: string;
  prenom?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}
