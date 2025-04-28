
import { getApiUrl } from '@/config/apiConfig';
import { User } from '@/types/auth';

export const getCurrentUser = (): string | User | null => {
  const token = sessionStorage.getItem('authToken');
  if (!token) return null;

  try {
    const userData = JSON.parse(atob(token.split('.')[1]));
    return userData.user || userData.identifiant_technique || null;
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

export const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    if (data.success && data.token) {
      sessionStorage.setItem('authToken', data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const logout = () => {
  sessionStorage.removeItem('authToken');
};
