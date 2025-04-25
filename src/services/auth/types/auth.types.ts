
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
  [key: string]: string; // Ajout d'un index signature pour satisfaire Record<string, string>
  'Content-Type': string;
  'Cache-Control': string;
  'Accept': string;
  'Authorization'?: string;
}
