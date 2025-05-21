
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/components/ui/use-toast';
import { LoginResponse } from '@/types/auth';
import { convertEmailToTechnicalId } from '../core/userIdConverter';

// Variable pour stocker l'utilisateur connecté
let currentUser: string | null = null;
let currentToken: string | null = null;
let isLoggedIn = false;

// Mapping d'emails vers des identifiants techniques
const EMAIL_TO_ID_MAPPING: Record<string, string> = {
  'antcirier@gmail.com': 'p71x6d_cirier',
  'admin@example.com': 'p71x6d_system'
};

/**
 * Vérifie si l'entrée est une adresse email
 */
const isEmail = (input: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

/**
 * Convertit un email en identifiant technique
 */
const convertEmailToId = (email: string): string => {
  if (EMAIL_TO_ID_MAPPING[email]) {
    return EMAIL_TO_ID_MAPPING[email];
  }
  
  // Si c'est un email mais pas dans le mapping, créer un ID technique
  if (isEmail(email)) {
    const username = email.split('@')[0];
    return `p71x6d_${username.toLowerCase()}`;
  }
  
  return email;
}

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
  if (storedUser && storedUser !== 'null' && storedUser !== 'undefined' && storedUser !== '[object Object]') {
    // Vérifier que ce n'est pas un ID système
    if (storedUser === 'p71x6d_system' || storedUser === 'p71x6d_system2' || storedUser === 'system' || storedUser === 'admin') {
      console.warn("Tentative d'utilisation d'un ID système restreint, déclencher une déconnexion de sécurité");
      logout(); // Déconnecter l'utilisateur pour éviter tout problème
      return 'anonymous';
    }
    
    currentUser = storedUser;
    return storedUser;
  }
  
  // Tenter de récupérer l'ID depuis le token JWT
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload && payload.user_id) {
        // Vérifier que ce n'est pas un ID système
        if (payload.user_id !== 'p71x6d_system' && 
            payload.user_id !== 'p71x6d_system2' && 
            payload.user_id !== 'system' && 
            payload.user_id !== 'admin') {
          localStorage.setItem('user_id', payload.user_id);
          currentUser = payload.user_id;
          return payload.user_id;
        } else {
          console.warn("Token contient un ID système restreint, déconnexion pour sécurité");
          logout();
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID depuis le token:", error);
  }
  
  // Valeur par défaut sécurisée
  return 'anonymous';
};

/**
 * Connecte un utilisateur
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  // Nettoyer tout état utilisateur précédent
  logout();
  
  try {
    const API_URL = getApiUrl();
    
    console.log(`Tentative de connexion au serveur pour l'utilisateur ${username}`);
    
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.success && data.token) {
      // Vérifier que l'ID utilisateur est valide et non restreint
      let userId = data.user?.identifiant_technique || username;
      
      // Si c'est un email, le convertir en ID technique
      if (isEmail(userId)) {
        userId = convertEmailToId(userId);
        console.log(`ID converti d'email à identifiant technique: ${userId}`);
      }
      
      if (userId === 'p71x6d_system' || userId === 'p71x6d_system2' || userId === 'system' || userId === 'admin') {
        console.warn(`Tentative de connexion avec un ID restreint: ${userId}`);
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Connexion avec cet identifiant non autorisée"
        });
        return {
          success: false,
          message: "Utilisateur non autorisé"
        };
      }
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', userId);
      currentUser = userId;
      currentToken = data.token;
      isLoggedIn = true;
      
      console.log(`Connexion réussie pour l'utilisateur ${userId}`);
      
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
  
  // Nettoyer également les données utilisateur du localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('data_') || key.includes('sync_'))) {
      localStorage.removeItem(key);
    }
  }
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
    // Si c'est un email, le convertir
    if (isEmail(userId)) {
      const technicalId = convertEmailToId(userId);
      localStorage.setItem('user_id', technicalId);
      currentUser = technicalId;
      return technicalId;
    }
    return userId;
  }
  
  // Si pas d'ID utilisateur, vérifier le token
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return 'p71x6d_richard'; // Valeur par défaut sécurisée
  }
  
  try {
    // Décodage simple du JWT (sans vérification de signature)
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload && payload.user_id) {
      // Si c'est un email, le convertir
      const finalId = isEmail(payload.user_id) ? convertEmailToId(payload.user_id) : payload.user_id;
      localStorage.setItem('user_id', finalId);
      currentUser = finalId;
      return finalId;
    }
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
  }
  
  return 'p71x6d_richard'; // Valeur par défaut sécurisée
};

