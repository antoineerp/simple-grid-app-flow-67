import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';

/**
 * Enregistre le token d'authentification dans le sessionStorage
 * @param token Le token d'authentification à enregistrer
 */
export const setAuthToken = (token: string): void => {
  sessionStorage.setItem('authToken', token);
};

/**
 * Supprime le token d'authentification du sessionStorage
 */
export const removeAuthToken = (): void => {
  sessionStorage.removeItem('authToken');
};

/**
 * Récupère le token d'authentification depuis le sessionStorage
 * @returns Le token d'authentification ou null s'il n'existe pas
 */
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken');
};

/**
 * Définit si l'utilisateur est connecté ou non dans le sessionStorage
 * @param isLoggedIn Un booléen indiquant si l'utilisateur est connecté
 */
export const setIsLoggedIn = (isLoggedIn: boolean): void => {
  sessionStorage.setItem('isLoggedIn', String(isLoggedIn));
};

/**
 * Récupère l'état de connexion de l'utilisateur depuis le sessionStorage
 * @returns Un booléen indiquant si l'utilisateur est connecté ou false par défaut
 */
export const getIsLoggedIn = (): boolean => {
  return sessionStorage.getItem('isLoggedIn') === 'true';
};

/**
 * Supprime l'état de connexion de l'utilisateur du sessionStorage
 */
export const removeIsLoggedIn = (): void => {
  sessionStorage.removeItem('isLoggedIn');
};

/**
 * Enregistre les données d'authentification de l'utilisateur dans le sessionStorage
 * @param user L'utilisateur à enregistrer
 */
export const setAuthData = (user: string): void => {
  sessionStorage.setItem('authData', JSON.stringify({ user }));
};

/**
 * Supprime les données d'authentification de l'utilisateur du sessionStorage
 */
export const removeAuthData = (): void => {
  sessionStorage.removeItem('authData');
};

/**
 * Récupère l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): string | null => {
  const authData = sessionStorage.getItem('authData');
  if (authData) {
    try {
      const parsedData = JSON.parse(authData);
      return parsedData.user || 'p71x6d_system';
    } catch (e) {
      console.error('Erreur lors de la lecture des données d\'authentification:', e);
      return 'p71x6d_system'; // Valeur par défaut pour la compatibilité
    }
  }
  // Valeur par défaut pour assurer le fonctionnement avec Infomaniak
  return 'p71x6d_system';
};

/**
 * Génère les headers d'authentification pour les requêtes API
 * @returns Un objet contenant les headers d'authentification
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Envoie une requête de connexion à l'API
 * @param email L'email de l'utilisateur
 * @param password Le mot de passe de l'utilisateur
 * @returns Une promesse contenant les données de l'utilisateur ou null en cas d'erreur
 */
export const login = async (email: string, password: string): Promise<any | null> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetchWithErrorHandling(`${API_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (response && response.success) {
      setAuthToken(response.token);
      setIsLoggedIn(true);
      setAuthData(response.user);
      return response;
    } else {
      console.error('Erreur lors de la connexion:', response ? response.message : 'Erreur inconnue');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la requête de connexion:', error);
    throw error;
  }
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = (): void => {
  removeAuthToken();
  removeIsLoggedIn();
  removeAuthData();
};
