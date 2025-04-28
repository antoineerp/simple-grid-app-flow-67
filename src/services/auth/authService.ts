
import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';

// Variables en mémoire pour stocker les informations d'authentification pendant la session
let inMemoryToken: string | null = null;
let inMemoryLoggedIn: boolean = false;
let inMemoryUser: string | null = null;

/**
 * Enregistre le token d'authentification en mémoire
 * @param token Le token d'authentification à enregistrer
 */
export const setAuthToken = (token: string): void => {
  inMemoryToken = token;
};

/**
 * Supprime le token d'authentification de la mémoire
 */
export const removeAuthToken = (): void => {
  inMemoryToken = null;
};

/**
 * Récupère le token d'authentification depuis la mémoire
 * @returns Le token d'authentification ou null s'il n'existe pas
 */
export const getAuthToken = (): string | null => {
  return inMemoryToken;
};

/**
 * Définit si l'utilisateur est connecté ou non en mémoire
 * @param isLoggedIn Un booléen indiquant si l'utilisateur est connecté
 */
export const setIsLoggedIn = (isLoggedIn: boolean): void => {
  inMemoryLoggedIn = isLoggedIn;
};

/**
 * Récupère l'état de connexion de l'utilisateur depuis la mémoire
 * @returns Un booléen indiquant si l'utilisateur est connecté ou false par défaut
 */
export const getIsLoggedIn = (): boolean => {
  return inMemoryLoggedIn;
};

/**
 * Supprime l'état de connexion de l'utilisateur de la mémoire
 */
export const removeIsLoggedIn = (): void => {
  inMemoryLoggedIn = false;
};

/**
 * Enregistre les données d'authentification de l'utilisateur en mémoire
 * @param user L'utilisateur à enregistrer
 */
export const setAuthData = (user: string): void => {
  inMemoryUser = user;
};

/**
 * Supprime les données d'authentification de l'utilisateur de la mémoire
 */
export const removeAuthData = (): void => {
  inMemoryUser = null;
};

/**
 * Récupère l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): string | null => {
  return inMemoryUser || 'p71x6d_system'; // Valeur par défaut pour la compatibilité
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
    console.log('Tentative de connexion vers:', `${API_URL}/login.php`);
    
    const response = await fetchWithErrorHandling(`${API_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (response && response.success) {
      console.log('Connexion réussie, sauvegarde des informations en mémoire');
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
  console.log('Déconnexion en cours, suppression des informations en mémoire');
  removeAuthToken();
  removeIsLoggedIn();
  removeAuthData();
};
