
// Configuration de l'API
export const getApiUrl = (): string => {
  // En environnement de production, utiliser un chemin relatif
  // Cela permettra aux appels d'API de fonctionner indépendamment du domaine
  if (localStorage.getItem('customApiUrl')) {
    return localStorage.getItem('customApiUrl') as string;
  }
  // Utiliser un chemin relatif par défaut pour fonctionner sur tout domaine
  // Assurons-nous qu'il n'y a pas de double slash
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
    : window.location.origin + '/api';
  
  // Normaliser l'URL pour éviter les double slashes
  return baseUrl.replace(/([^:]\/)\/+/g, "$1");
};
