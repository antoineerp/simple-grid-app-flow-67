
// Configuration de l'API
export const getApiUrl = (): string => {
  // Si une URL personnalisée est définie dans le localStorage, l'utiliser
  if (localStorage.getItem('customApiUrl')) {
    return localStorage.getItem('customApiUrl') as string;
  }
  
  // Si on est sur qualiopi.ch, utiliser un chemin spécifique
  if (window.location.hostname === 'qualiopi.ch') {
    // Vérifier si nous sommes dans un sous-dossier
    if (window.location.pathname.includes('/sites/')) {
      // Extraire le chemin du sous-dossier
      const pathMatch = window.location.pathname.match(/^(\/sites\/[^\/]+)/);
      if (pathMatch && pathMatch[1]) {
        return `${pathMatch[1]}/api`;
      }
    }
    // Si nous sommes à la racine du domaine ou pas de sous-dossier détecté
    return '/sites/qualiopi.ch/api';
  }
  
  // Utiliser un chemin relatif par défaut pour fonctionner sur tout domaine
  return '/api';
};

// Définir une URL d'API personnalisée (utile pour le développement ou tests)
export const setCustomApiUrl = (url: string): void => {
  if (url && url.trim() !== '') {
    // Normaliser l'URL pour éviter les double slashes
    const normalizedUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('customApiUrl', normalizedUrl);
    console.log(`URL d'API personnalisée définie: ${normalizedUrl}`);
  }
};

// Réinitialiser à l'URL d'API par défaut
export const resetToDefaultApiUrl = (): void => {
  localStorage.removeItem('customApiUrl');
  console.log("URL d'API réinitialisée à la valeur par défaut");
};

// Vérifier si l'application utilise une URL d'API personnalisée
export const isUsingCustomApiUrl = (): boolean => {
  return !!localStorage.getItem('customApiUrl');
};

// Obtenir l'URL d'API complète (pour affichage uniquement)
export const getFullApiUrl = (): string => {
  const baseUrl = isUsingCustomApiUrl() 
    ? localStorage.getItem('customApiUrl') as string
    : window.location.hostname === 'qualiopi.ch' 
      ? window.location.origin + '/sites/qualiopi.ch/api'
      : window.location.origin + '/api';
  
  // Normaliser l'URL pour éviter les double slashes
  return baseUrl.replace(/([^:]\/)\/+/g, "$1");
};
