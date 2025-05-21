import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/components/ui/use-toast';
import { LoginResponse } from '@/types/auth';
import { convertEmailToTechnicalId } from '../core/userIdConverter';

// Variable pour stocker l'utilisateur connecté
let currentUser: string | null = null;
let currentToken: string | null = null;
let isLoggedIn = false;

// Mapping d'emails vers des identifiants techniques - TOUJOURS utiliser p71x6d_richard
const EMAIL_TO_ID_MAPPING: Record<string, string> = {
  'antcirier@gmail.com': 'p71x6d_richard',
  'admin@example.com': 'p71x6d_richard'
};

/**
 * Vérifie si l'entrée est une adresse email
 */
const isEmail = (input: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

/**
 * Convertit un email en identifiant technique
 * TOUJOURS utiliser p71x6d_richard pour antcirier@gmail.com
 */
const convertEmailToId = (email: string): string => {
  if (email === 'antcirier@gmail.com') {
    console.log('Utilisateur administrateur détecté: antcirier@gmail.com - Utilisation de p71x6d_richard');
    return 'p71x6d_richard';
  }
  
  if (EMAIL_TO_ID_MAPPING[email]) {
    return EMAIL_TO_ID_MAPPING[email];
  }
  
  // Pour tous les autres utilisateurs, utiliser également p71x6d_richard
  console.log(`Email ${email} - Utilisation de p71x6d_richard par défaut`);
  return 'p71x6d_richard';
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
 * Toujours retourne p71x6d_richard pour l'administrateur
 */
export const getCurrentUser = (): string => {
  // Vérifier l'utilisateur dans localStorage
  const storedEmail = localStorage.getItem('userEmail');
  
  // Cas spécial pour antcirier@gmail.com
  if (storedEmail === 'antcirier@gmail.com') {
    console.log('Email administrateur détecté: antcirier@gmail.com - Utilisation de p71x6d_richard');
    currentUser = 'p71x6d_richard';
    return 'p71x6d_richard';
  }
  
  // Si déjà mis en cache, le retourner (sauf si c'est un ID système)
  if (currentUser && currentUser !== 'p71x6d_system' && currentUser !== 'p71x6d_system2') {
    return currentUser;
  }
  
  // Sinon, essayer de le récupérer du localStorage
  const storedUser = localStorage.getItem('user_id');
  if (storedUser && storedUser !== 'null' && storedUser !== 'undefined' && storedUser !== '[object Object]') {
    // Vérifier que ce n'est pas un ID système
    if (storedUser === 'p71x6d_system' || storedUser === 'p71x6d_system2' || storedUser === 'system' || storedUser === 'admin') {
      console.warn("ID système détecté, utilisation de p71x6d_richard");
      currentUser = 'p71x6d_richard';
      localStorage.setItem('user_id', 'p71x6d_richard');
      return 'p71x6d_richard';
    }
    
    currentUser = storedUser;
    return storedUser;
  }
  
  // Par défaut, utiliser p71x6d_richard
  console.log("Aucun ID trouvé, utilisation de p71x6d_richard par défaut");
  currentUser = 'p71x6d_richard';
  localStorage.setItem('user_id', 'p71x6d_richard');
  return 'p71x6d_richard';
};

/**
 * Connecte un utilisateur
 * Modifié pour toujours utiliser p71x6d_richard pour antcirier@gmail.com
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    // Cas spécial pour antcirier@gmail.com
    if (username === 'antcirier@gmail.com') {
      console.log("Connexion pour l'administrateur antcirier@gmail.com - Attribution de p71x6d_richard");
      
      // Nettoyer tout état utilisateur précédent
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      currentUser = null;
      currentToken = null;
      isLoggedIn = false;
      
      // Stocker email original pour référence future
      localStorage.setItem('userEmail', username);
      localStorage.setItem('user_id', 'p71x6d_richard');
      localStorage.setItem('originalUserId', 'p71x6d_richard');
      
      // Connexion directe sans appel au serveur pour l'admin
      const adminToken = "admin_" + Date.now().toString(36);
      localStorage.setItem('auth_token', adminToken);
      currentUser = 'p71x6d_richard';
      currentToken = adminToken;
      isLoggedIn = true;
      
      // Stocker les données utilisateur et le rôle explicitement
      const adminUser = {
        id: 'p71x6d_richard',
        email: username,
        role: 'admin',
        identifiant_technique: 'p71x6d_richard'
      };
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      localStorage.setItem('userRole', 'admin');
      
      console.log(`Connexion directe réussie pour l'administrateur, ID: p71x6d_richard`);
      
      return {
        success: true,
        token: adminToken,
        message: "Connexion administrateur réussie",
        user: adminUser
      };
    }
    
    // Pour les autres utilisateurs, flux standard avec vérification supplémentaire
    console.log(`Tentative de connexion au serveur pour l'utilisateur ${username}`);
    
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
      // Vérifier que l'ID utilisateur est valide et non restreint
      let userId = data.user?.identifiant_technique || username;
      
      // Si c'est un email, le convertir en ID technique
      if (isEmail(userId)) {
        // Forcer p71x6d_richard pour tous les utilisateurs
        userId = 'p71x6d_richard';
        console.log(`Tous les utilisateurs pointent vers la base: p71x6d_richard`);
      }
      
      // Bloquer explicitement les IDs système
      if (userId === 'p71x6d_system' || userId === 'p71x6d_system2' || userId === 'system' || userId === 'admin') {
        console.warn(`ID système détecté: ${userId}, utilisation de p71x6d_richard à la place`);
        userId = 'p71x6d_richard';
      }
      
      // Stocker email original pour référence future
      localStorage.setItem('userEmail', username);
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', userId);
      currentUser = userId;
      currentToken = data.token;
      isLoggedIn = true;
      
      console.log(`Connexion réussie pour l'utilisateur ${username}, ID: ${userId}`);
      
      // Stocker les données utilisateur et le rôle explicitement
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (data.user.role) {
          localStorage.setItem('userRole', data.user.role);
        }
      }
      
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
  localStorage.removeItem('userEmail');
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
 * Modifié pour toujours utiliser p71x6d_richard
 */
export const ensureUserIdFromToken = (): string => {
  // Vérifier si c'est l'administrateur
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail === 'antcirier@gmail.com') {
    console.log('Email administrateur détecté lors de la vérification du token - Utilisation de p71x6d_richard');
    localStorage.setItem('user_id', 'p71x6d_richard');
    currentUser = 'p71x6d_richard';
    return 'p71x6d_richard';
  }

  const userId = localStorage.getItem('user_id');
  if (userId && userId !== 'p71x6d_system' && userId !== 'p71x6d_system2') {
    return userId;
  }
  
  // Si pas d'ID utilisateur ou ID système, forcer p71x6d_richard
  console.log("Forçage de l'ID utilisateur vers p71x6d_richard");
  localStorage.setItem('user_id', 'p71x6d_richard');
  currentUser = 'p71x6d_richard';
  return 'p71x6d_richard';
};
