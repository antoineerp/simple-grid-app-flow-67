
import { getCurrentUser } from './databaseConnectionService';

/**
 * Middleware de validation des requêtes API
 * Vérifie que toutes les requêtes contiennent un ID utilisateur
 */

// Liste des endpoints qui peuvent échapper à la validation (très limité)
const EXEMPT_ENDPOINTS = [
  'auth.php',
  'login.php',
  'register.php',
  'info.php', 
  'test.php',
  'diagnostic.php',
  'check-users.php'
];

// Vérifie si un endpoint est exempté de validation
const isExemptEndpoint = (url: string): boolean => {
  return EXEMPT_ENDPOINTS.some(exempt => url.includes(exempt));
};

// Intercepteur pour les requêtes fetch
export const validateApiRequest = (url: string, options: RequestInit = {}): boolean => {
  // Ne pas valider les endpoints exemptés
  if (isExemptEndpoint(url)) {
    return true;
  }
  
  const userId = getCurrentUser();
  
  // Vérifier si l'URL contient déjà un ID utilisateur
  const hasUserIdInUrl = url.includes('userId=');
  
  // Vérifier si le body contient un ID utilisateur (pour les requêtes POST)
  let hasUserIdInBody = false;
  if (options.body && typeof options.body === 'string') {
    try {
      const bodyData = JSON.parse(options.body);
      hasUserIdInBody = bodyData && bodyData.userId === userId;
    } catch (e) {
      // Ignorer les erreurs de parsing, considérer qu'il n'y a pas d'ID utilisateur
    }
  }
  
  // La requête est valide si elle contient l'ID utilisateur soit dans l'URL, soit dans le body
  const isValid = hasUserIdInUrl || hasUserIdInBody;
  
  if (!isValid) {
    console.error(`ERREUR CRITIQUE: Tentative de requête API sans ID utilisateur: ${url}`);
    throw new Error(`Erreur de sécurité: requête API sans identifiant utilisateur vers ${url}`);
  }
  
  return isValid;
};

// Décorateur pour les fonctions de requête API
export const withUserIdValidation = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const url = args[0];
    const options = args[1] || {};
    
    if (!isExemptEndpoint(url)) {
      validateApiRequest(url, options);
    }
    
    return fn(...args);
  }) as T;
};

// Hooks pour intégrer avec React
export const useApiRequestValidator = () => {
  return {
    validateApiRequest,
    withUserIdValidation
  };
};
