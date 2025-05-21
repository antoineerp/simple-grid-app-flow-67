
export interface Utilisateur {
  id: string;
  username: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive';
  last_login?: string;
  created_at?: string;
}
