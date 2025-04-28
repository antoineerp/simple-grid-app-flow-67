
import { getApiUrl } from '@/config/apiConfig';
import { User, AuthResponse } from '@/types/auth';

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
    console.log(`Tentative de connexion à: ${API_URL}/auth.php avec l'utilisateur: ${username}`);
    
    const response = await fetch(`${API_URL}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status}`);
      return { 
        success: false, 
        message: `Erreur serveur: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    console.log('Réponse de l\'authentification:', data);
    
    if (data.token) {
      sessionStorage.setItem('authToken', data.token);
      return { 
        success: true, 
        token: data.token,
        user: data.user || null,
        message: data.message || 'Connexion réussie'
      };
    }
    
    return { 
      success: false, 
      message: data.message || data.error || 'Identifiants invalides' 
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur lors de la connexion' 
    };
  }
};

export const logout = () => {
  sessionStorage.removeItem('authToken');
};
