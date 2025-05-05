
import { getApiUrl } from '@/config/apiConfig';
import { initializeUserTables, checkUserTablesInitialized } from '@/services/core/userInitializationService';
import { toast } from '@/components/ui/use-toast';
import { User, AuthResponse } from '@/types/auth';

/**
 * Effectue une requête d'authentification
 * @param endpoint L'URL de l'endpoint d'authentification
 * @param credentials Les identifiants de l'utilisateur
 */
export const authenticate = async (endpoint: string, credentials: any): Promise<any> => {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  return handleAuthResponse(response);
};

/**
 * Enregistre un nouvel utilisateur
 * @param userData Les données de l'utilisateur à enregistrer
 */
export const register = async (userData: any): Promise<any> => {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/register.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  return handleAuthResponse(response);
};

/**
 * Fonction de login
 * @param username Nom d'utilisateur ou email
 * @param password Mot de passe
 */
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    return handleAuthResponse(response);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de la connexion'
    };
  }
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const getIsLoggedIn = (): boolean => {
  return !!localStorage.getItem('token');
};

/**
 * Obtient le jeton d'authentification
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Alias de getToken pour compatibilité
 */
export const getAuthToken = (): string | null => {
  return getToken();
};

/**
 * Obtient les en-têtes d'authentification
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  window.location.href = '/';
};

/**
 * Obtient l'utilisateur courant
 */
export const getCurrentUser = (): User | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // Vérifier si c'est un token JWT valide
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Décoder le payload
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.user) return null;
    
    return payload.user;
  } catch (error) {
    console.error('Erreur lors du décodage du token JWT:', error);
    return null;
  }
};

/**
 * Traite la réponse d'authentification
 */
export const handleAuthResponse = async (response: Response): Promise<any> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Erreur d\'authentification');
  }
  
  if (data.token) {
    localStorage.setItem('token', data.token);
    
    if (data.user) {
      localStorage.setItem('userId', data.user.identifiant_technique || '');
      localStorage.setItem('userRole', data.user.role || 'utilisateur');
      
      // Vérifier et initialiser les tables utilisateur si nécessaire
      const tablesInitialized = await checkUserTablesInitialized();
      
      if (!tablesInitialized) {
        console.log("Initialisation des tables utilisateur...");
        await initializeUserTables();
        toast({
          title: "Tables initialisées",
          description: "Les tables de données ont été configurées pour votre compte."
        });
      }
    }
  }
  
  return data;
};
