
// Add login and other necessary functions
import { LoginResponse } from '@/types/auth';

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

// Add login function that was missing
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch('/api/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      return {
        success: false,
        message: errorData.message || `Erreur HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    
    if (data.success && data.token) {
      // Store token and user information
      localStorage.setItem('authToken', data.token);
      
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        if (data.user.identifiant_technique) {
          localStorage.setItem('currentDatabaseUser', data.user.identifiant_technique);
        }
        
        if (data.user.role) {
          localStorage.setItem('userRole', data.user.role);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur s'est produite lors de la connexion",
    };
  }
};

// Export as a complete service object
export const authService = {
  getIsLoggedIn,
  checkAuth,
  getAuthHeaders,
  getCurrentUser,
  logout,
  login,
};

// Export for backward compatibility
export default authService;
