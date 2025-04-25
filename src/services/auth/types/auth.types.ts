
export interface UserResponse {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UserResponse;
}

export interface AuthHeaders {
  'Content-Type': string;
  'Cache-Control': string;
  'Accept': string;
  'Authorization'?: string;
}
