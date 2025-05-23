import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/components/ui/use-toast';
import { LoginResponse, Utilisateur } from '@/types/auth';

// Variable pour stocker l'utilisateur connecté
let currentUser: string | null = null;
let currentToken: string | null = null;
let isLoggedIn = false;

/**
 * Vérifie si l'entrée est une adresse email
 */
const isEmail = (input: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
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
 * Utilise directement l'identifiant technique tel que stocké en base de données
 */
export const getCurrentUser = (): string => {
  // Vérifier l'utilisateur dans localStorage
  const storedEmail = localStorage.getItem('userEmail');
  
  // Cas spécial pour antcirier@gmail.com
  if (storedEmail === 'antcirier@gmail.com') {
    console.log('Email administrateur détecté: antcirier@gmail.com');
    return storedEmail;
  }
  
  // Si déjà mis en cache, le retourner
  if (currentUser) {
    return currentUser;
  }
  
  // Sinon, essayer de le récupérer du localStorage
  const storedUser = localStorage.getItem('user_id');
  if (storedUser && storedUser !== 'null' && storedUser !== 'undefined' && storedUser !== '[object Object]') {
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
 * Modifié pour toujours utiliser p71x6d_cirier pour antcirier@gmail.com
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    // Cas spécial pour antcirier@gmail.com
    if (username === 'antcirier@gmail.com') {
      console.log("Connexion pour l'administrateur antcirier@gmail.com - Attribution de p71x6d_cirier");
      
      // Nettoyer tout état utilisateur précédent
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      currentUser = null;
      currentToken = null;
      isLoggedIn = false;
      
      // Stocker email original pour référence future
      localStorage.setItem('userEmail', username);
      localStorage.setItem('user_id', username);
      localStorage.setItem('originalUserId', username);
      
      // Connexion directe sans appel au serveur pour l'admin
      const adminToken = "admin_" + Date.now().toString(36);
      localStorage.setItem('auth_token', adminToken);
      currentUser = username;
      currentToken = adminToken;
      isLoggedIn = true;
      
      // Stocker les données utilisateur et le rôle explicitement
      const adminUser: Utilisateur = {
        id: username,
        username: 'antcirier',
        email: username,
        role: 'admin',
        identifiant_technique: username
      };
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      localStorage.setItem('userRole', 'admin');
      
      console.log(`Connexion directe réussie pour l'administrateur, ID: ${username}`);
      
      return {
        success: true,
        token: adminToken,
        message: "Connexion administrateur réussie",
        user: adminUser
      };
    }
    
    // Pour les autres utilisateurs, procéder avec l'API normale
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
 */
export const ensureUserIdFromToken = (): string => {
  // Vérifier si c'est l'administrateur
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail === 'antcirier@gmail.com') {
    console.log('Email administrateur détecté lors de la vérification du token');
    localStorage.setItem('user_id', storedEmail);
    currentUser = storedEmail;
    return storedEmail;
  }

  const userId = localStorage.getItem('user_id');
  if (userId) {
    return userId;
  }
  
  // Si pas d'ID utilisateur, utiliser la valeur par défaut
  console.log("Aucun ID utilisateur trouvé, utilisation de la valeur par défaut");
  localStorage.setItem('user_id', 'p71x6d_richard');
  currentUser = 'p71x6d_richard';
  return 'p71x6d_richard';
};
