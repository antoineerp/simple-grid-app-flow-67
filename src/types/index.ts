// Types centralisés
export type UserRole = 'admin' | 'gestionnaire' | 'utilisateur';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: UserRole;
  date_creation?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface Member {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  fonction: string;
  organisation?: string;
  notes?: string;
  initiales: string;
  date_creation: Date;
}

export interface Document {
  id: string;
  nom: string;
  fichier_path?: string;
  responsabilites?: any;
  etat?: string;
  groupId?: string;
  excluded?: boolean;
  date_creation?: Date;
  date_modification?: Date;
}

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}
