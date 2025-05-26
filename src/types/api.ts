
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
}
