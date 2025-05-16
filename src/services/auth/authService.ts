
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
