
import { jwtDecode } from 'jwt-decode';
import { User } from '@/types/auth';

// Récupérer le token JWT du stockage
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return token;
};

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    // Vérifie que le token a le bon format avant de le décoder
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("Format de token invalide (doit avoir 3 parties)");
      return false;
    }
    
    const decodedToken: any = jwtDecode(token);
    // Vérifier si le token est expiré
    const currentTime = Date.now() / 1000;
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      // Token expiré, nettoyer les données d'authentification
      logout();
      return false;
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return false;
  }
};

// Récupérer les informations de l'utilisateur courant
export const getCurrentUser = (): User | null => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    // Vérifie que le token a le bon format avant de le décoder
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("Format de token invalide (doit avoir 3 parties)");
      return null;
    }
    
    const decodedToken: any = jwtDecode(token);
    
    // Vérifier si le token contient les informations de l'utilisateur au bon format
    if (decodedToken.user) {
      return decodedToken.user as User;
    } else {
      // En-têtes d'autorisation pour les requêtes API
      return decodedToken as User;
    }
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
    return null;
  }
};

// Déconnexion de l'utilisateur
export const logout = (): void => {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  
  // Redirection vers la page de connexion
  window.location.href = '/';
};

// En-têtes d'autorisation pour les requêtes API
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) return {};

  return {
    'Authorization': `Bearer ${token}`,
    'x-token': token
  };
};

// Vérifie si l'utilisateur a un rôle spécifique
export const hasRole = (role: string | string[]): boolean => {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
};

// Fonction pour vérifier si l'utilisateur est connecté
export const getIsLoggedIn = (): boolean => {
  return isAuthenticated() && !!getCurrentUser();
};

// Authentifier un utilisateur avec email/mot de passe
export const login = async (email: string, password: string, rememberMe: boolean = false): Promise<any> => {
  return await authenticateUser(email, password, rememberMe);
};

// Authentifier un utilisateur avec email/mot de passe
export const authenticateUser = async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
  try {
    // Définir l'URL de l'API
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    // Envoyer la demande d'authentification
    const response = await fetch(`${apiUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password: password,
        rememberMe: rememberMe
      }),
    });
    
    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur d\'authentification');
    }
    
    // Traiter la réponse
    const data = await response.json();
    
    // Vérifier que la réponse contient les données nécessaires
    if (!data || !data.token) {
      throw new Error('Réponse invalide du serveur');
    }
    
    // Stocker le token JWT dans le stockage approprié
    if (rememberMe) {
      localStorage.setItem('authToken', data.token);
    } else {
      sessionStorage.setItem('authToken', data.token);
    }
    
    // Retourner les informations de l'utilisateur
    return data.user;
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    throw error;
  }
};

// Récupérer l'ID de l'utilisateur courant
export const getCurrentUserId = (): string | undefined => {
  const user = getCurrentUser();
  return user?.id;
};

// Récupérer le nom complet de l'utilisateur courant
export const getCurrentUserName = (): string => {
  const user = getCurrentUser();
  if (!user) return '';
  return `${user.prenom || ''} ${user.nom || ''}`.trim();
};

// Vérifier si l'utilisateur est administrateur
export const isAdmin = (): boolean => {
  return hasRole(['administrateur', 'admin']);
};
