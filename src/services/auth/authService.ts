
import { User } from '@/types/auth';
import { getApiUrl } from '@/config/apiConfig';

// Récupérer le token d'authentification
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Générer les en-têtes d'authentification
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Vérifier si le token est au format JWT correct
export const validateAndFixToken = (token: string): string | null => {
  // Un JWT valide est composé de trois parties séparées par des points
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error("Format de token invalide:", token);
    return null;
  }
  return token;
};

// Récupérer l'utilisateur courant depuis le localStorage
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};

// Vérifier la validité du token avec le serveur
export const verifyUserSession = async (): Promise<boolean> => {
  const token = getAuthToken();
  
  if (!token) {
    return false;
  }
  
  try {
    const API_URL = getApiUrl();
    
    if (!API_URL) {
      throw new Error("URL de l'API non configurée");
    }
    
    const response = await fetch(`${API_URL}/verify-session.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Si la réponse n'est pas 200 OK, la session n'est pas valide
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Erreur lors de la vérification de la session:", error);
    // En cas d'erreur réseau, on considère que le token est valide pour éviter de déconnecter l'utilisateur
    return true;
  }
};

// Fonction d'authentification
export const login = async (username: string, password: string): Promise<any> => {
  const API_URL = getApiUrl();
  
  if (!API_URL) {
    throw new Error("URL de l'API non configurée");
  }
  
  const response = await fetch(`${API_URL}/auth.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  // Si la réponse n'est pas 200 OK
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur d'authentification (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  // Stocker le token et les données utilisateur
  if (data.token) {
    const validToken = validateAndFixToken(data.token);
    
    if (validToken) {
      localStorage.setItem('authToken', validToken);
      sessionStorage.setItem('authToken', validToken);
    } else {
      throw new Error("Format de token invalide reçu du serveur");
    }
  }
  
  if (data.user) {
    localStorage.setItem('currentUser', JSON.stringify(data.user));
  }
  
  return data;
};

// Fonction d'authentification alternative avec données d'utilisateur préexistantes
export const authenticateUser = async (userData: any): Promise<any> => {
  if (userData && userData.token) {
    const validToken = validateAndFixToken(userData.token);
    
    if (validToken) {
      localStorage.setItem('authToken', validToken);
      sessionStorage.setItem('authToken', validToken);
    } else {
      throw new Error("Format de token invalide");
    }
  }
  
  if (userData && userData.user) {
    localStorage.setItem('currentUser', JSON.stringify(userData.user));
  }
  
  return userData;
};

// Fonction de déconnexion
export const logout = (): void => {
  // Supprimer le token et les données utilisateur du stockage local
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
  localStorage.removeItem('isAdministrator');
  localStorage.removeItem('currentUserId');
  sessionStorage.removeItem('authToken');
  
  // Rediriger vers la page de connexion
  window.location.href = '/';
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!token && !!user;
};

// Vérifier si l'utilisateur est administrateur
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  const role = user?.role || localStorage.getItem('userRole');
  return role === 'admin' || role === 'administrateur' || localStorage.getItem('isAdministrator') === 'true';
};

// Récupérer l'identifiant de l'utilisateur courant
export const getCurrentUserId = (): string | undefined => {
  const user = getCurrentUser();
  return user?.id || localStorage.getItem('currentUserId') || undefined;
};

// Récupérer le nom complet de l'utilisateur courant
export const getCurrentUserName = (): string => {
  const user = getCurrentUser();
  return user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';
};

// Vérifier si l'utilisateur est connecté (alias de isAuthenticated pour compatibilité)
export const getIsLoggedIn = (): boolean => {
  return isAuthenticated();
};

// Vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  const userRole = user?.role || localStorage.getItem('userRole');
  
  if (!userRole) return false;
  
  // Normaliser les rôles admin et administrateur
  if (role === 'admin' || role === 'administrateur') {
    return userRole === 'admin' || userRole === 'administrateur';
  }
  
  return userRole === role;
};
