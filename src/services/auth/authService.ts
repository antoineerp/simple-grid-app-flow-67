
import { getApiUrl } from '@/config/apiConfig';
import { initializeUserTables, checkUserTablesInitialized } from '@/services/core/userInitializationService';
import { toast } from '@/components/ui/use-toast';

// Clés pour le stockage local
const USER_TOKEN_KEY = 'user_token';
const USER_DATA_KEY = 'user_data';

// Interface pour les données utilisateur
export interface UserData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
}

/**
 * Effectue une tentative de connexion
 */
export async function login(email: string, password: string): Promise<UserData | null> {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Échec de connexion');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Identifiants invalides');
    }
    
    // Stocker le jeton et les données utilisateur
    localStorage.setItem(USER_TOKEN_KEY, data.token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    
    // Initialiser les tables utilisateur si nécessaire
    if (data.user && data.user.identifiant_technique) {
      const userId = data.user.identifiant_technique;
      
      // Vérifier si les tables utilisateur sont déjà initialisées
      const initialized = await checkUserTablesInitialized(userId);
      
      if (!initialized) {
        console.log(`Tables non initialisées pour ${userId}, démarrage de l'initialisation...`);
        
        // Initialiser les tables utilisateur
        const initResult = await initializeUserTables(userId);
        
        if (initResult) {
          toast({
            title: "Initialisation des données",
            description: "Vos données ont été initialisées avec succès.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Attention",
            description: "Vos données n'ont pas pu être complètement initialisées."
          });
        }
      } else {
        console.log(`Tables déjà initialisées pour ${userId}`);
      }
    }
    
    return data.user;
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
}

/**
 * Déconnecte l'utilisateur
 */
export function logout(): void {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export function getIsLoggedIn(): boolean {
  return !!localStorage.getItem(USER_TOKEN_KEY);
}

/**
 * Récupère les données de l'utilisateur connecté
 */
export function getCurrentUser(): UserData | null {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
}

/**
 * Récupère le jeton d'authentification
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(USER_TOKEN_KEY);
}

/**
 * Génère les en-têtes d'authentification
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Change le mot de passe utilisateur
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/change-password.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId,
        currentPassword,
        newPassword
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Échec du changement de mot de passe');
    }
    
    const data = await response.json();
    return data.success;
    
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    throw error;
  }
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user ? user.role === role : false;
}

/**
 * Vérifie si l'utilisateur est administrateur
 */
export function isAdmin(): boolean {
  return hasRole('admin') || hasRole('administrateur');
}
