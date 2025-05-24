
import { LoginResponse } from '@/types/auth';
import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';

export const getIsLoggedIn = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

export const checkAuth = (): boolean => {
  return getIsLoggedIn();
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem('currentDatabaseUser');
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
  localStorage.removeItem('currentDatabaseUser');
};

// Fonction de login unifiée
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
    const API_URL = getApiUrl();
    
    const response = await fetchWithErrorHandling(`${API_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (response.success && response.token) {
      // Store token and user information
      localStorage.setItem('authToken', response.token);
      
      if (response.user) {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        if (response.user.identifiant_technique) {
          localStorage.setItem('currentDatabaseUser', response.user.identifiant_technique);
          console.log(`Utilisateur connecté: ${response.user.identifiant_technique}`);
        }
        
        if (response.user.role) {
          localStorage.setItem('userRole', response.user.role);
        }
      }
      
      console.log("Connexion réussie avec les données:", response);
    }
    
    return response;
  } catch (error) {
    console.error("Exception lors de la connexion:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur s'est produite lors de la connexion",
    };
  }
};

export const authService = {
  getIsLoggedIn,
  checkAuth,
  getAuthHeaders,
  getCurrentUser,
  logout,
  login,
};

export default authService;
