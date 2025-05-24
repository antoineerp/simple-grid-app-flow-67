
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

// Fonction de login - utilise EXCLUSIVEMENT la base de données Infomaniak
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log(`CONNEXION EXCLUSIVE VIA BASE DE DONNÉES INFOMANIAK pour: ${username}`);
    const API_URL = getApiUrl();
    
    // UNIQUEMENT l'endpoint /auth de la base de données Infomaniak
    const response = await fetchWithErrorHandling(`${API_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    console.log("Réponse de la base de données Infomaniak:", response);
    
    if (response.success && response.token) {
      console.log("✅ CONNEXION RÉUSSIE VIA BASE DE DONNÉES INFOMANIAK");
      
      // Store token and user information
      localStorage.setItem('authToken', response.token);
      
      if (response.user) {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        if (response.user.identifiant_technique) {
          localStorage.setItem('currentDatabaseUser', response.user.identifiant_technique);
          console.log(`Utilisateur connecté depuis la base de données: ${response.user.identifiant_technique}`);
        }
        
        if (response.user.role) {
          localStorage.setItem('userRole', response.user.role);
        }
      }
      
      console.log("Connexion réussie avec les données de la base de données Infomaniak:", response);
    } else {
      console.error("❌ ERREUR: Réponse invalide de la base de données Infomaniak:", response);
      return {
        success: false,
        message: `ERREUR BASE DE DONNÉES: ${response.message || "Connexion à la base de données Infomaniak impossible"}`,
      };
    }
    
    return response;
  } catch (error) {
    console.error("❌ EXCEPTION: Erreur critique lors de la connexion à la base de données Infomaniak:", error);
    return {
      success: false,
      message: `ERREUR CRITIQUE BASE DE DONNÉES: ${error instanceof Error ? error.message : "Impossible de se connecter à la base de données Infomaniak"}`,
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
