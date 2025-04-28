
import { getApiUrl } from '@/config/apiConfig';

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

export const getCurrentUser = (): User | null => {
  const token = sessionStorage.getItem('authToken');
  if (!token) return null;

  try {
    const userData = JSON.parse(atob(token.split('.')[1]));
    return userData.user || null;
  } catch {
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken');
};

export const getIsLoggedIn = (): boolean => {
  return !!getAuthToken();
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success && data.token) {
      sessionStorage.setItem('authToken', data.token);
      return data;
    }
    return { success: false, message: data.message || 'Identifiants invalides' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur lors de la connexion' 
    };
  }
};

export const logout = () => {
  sessionStorage.removeItem('authToken');
};
