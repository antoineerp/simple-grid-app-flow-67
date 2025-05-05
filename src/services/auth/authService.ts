import { getApiUrl } from '@/config/apiConfig';
import { initializeUserTables, checkUserTablesInitialized } from '@/services/core/userInitializationService';
import { toast } from '@/components/ui/use-toast';

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
