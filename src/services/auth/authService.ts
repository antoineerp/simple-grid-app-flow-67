
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/components/ui/use-toast';
import { LoginResponse } from '@/types/auth';

// Variable pour stocker l'utilisateur connecté
let currentUser: string | null = null;
let currentToken: string | null = null;
let isLoggedIn = false;

/**
 * Récupère les en-têtes d'authentification pour les requêtes API
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

/**
 * Récupère le token d'authentification
 */
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token') || null;
};

/**
 * Récupère l'ID utilisateur actuellement connecté
 */
export const getCurrentUser = (): string => {
  // Si déjà mis en cache, le retourner
  if (currentUser) {
    return currentUser;
  }
  
  // Sinon, essayer de le récupérer du localStorage
  const storedUser = localStorage.getItem('user_id');
  if (storedUser) {
    currentUser = storedUser;
    return storedUser;
  }
  
  // Valeur par défaut sécurisée
  return 'anonymous';
};

/**
 * Connecte un utilisateur
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', data.user_id || username);
      currentUser = data.user_id || username;
      currentToken = data.token;
      isLoggedIn = true;
      
      return data;
    } else {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: data.message || "Nom d'utilisateur ou mot de passe incorrect"
      });
      return {
        success: false,
        message: data.message || "Échec de la connexion"
      };
    }
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    toast({
      variant: "destructive",
      title: "Erreur de connexion",
      description: "Impossible de se connecter au serveur"
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossible de se connecter au serveur"
    };
  }
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
  currentUser = null;
  currentToken = null;
  isLoggedIn = false;
};

/**
 * Enregistre un nouvel utilisateur
 */
export const register = async (userData: any): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/register.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (data.success) {
      toast({
        title: "Inscription réussie",
        description: "Vous pouvez maintenant vous connecter"
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: data.message || "Une erreur est survenue lors de l'inscription"
      });
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    toast({
      variant: "destructive",
      title: "Erreur d'inscription",
      description: "Impossible de se connecter au serveur"
    });
    return false;
  }
};

/**
 * Vérifie si un token est valide
 */
export const verifyToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/verify-token.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();
    
    if (data.valid) {
      // Mettre à jour l'utilisateur si nécessaire
      if (data.user_id) {
        localStorage.setItem('user_id', data.user_id);
        currentUser = data.user_id;
      }
      isLoggedIn = true;
      return true;
    } else {
      // Token invalide, déconnexion
      logout();
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return false;
  }
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const getIsLoggedIn = (): boolean => {
  return isLoggedIn || !!localStorage.getItem('auth_token');
};

/**
 * S'assure que l'ID utilisateur est récupéré du token JWT
 */
export const ensureUserIdFromToken = (): string => {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    return userId;
  }
  
  // Si pas d'ID utilisateur, vérifier le token
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return 'anonymous';
  }
  
  try {
    // Décodage simple du JWT (sans vérification de signature)
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload && payload.user_id) {
      localStorage.setItem('user_id', payload.user_id);
      currentUser = payload.user_id;
      return payload.user_id;
    }
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
  }
  
  return 'anonymous';
};
