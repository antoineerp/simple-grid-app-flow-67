
// Configuration de l'API
export const getApiUrl = (): string => {
  // En environnement de production, utiliser un chemin relatif
  // Cela permettra aux appels d'API de fonctionner indépendamment du domaine
  if (localStorage.getItem('customApiUrl')) {
    return localStorage.getItem('customApiUrl') as string;
  }
  return '/api';
};

// Définir une URL d'API personnalisée
export const setCustomApiUrl = (url: string): void => {
  if (url && url.trim() !== '') {
    localStorage.setItem('customApiUrl', url.trim());
    console.log(`URL d'API personnalisée définie: ${url}`);
  }
};

// Réinitialiser à l'URL d'API par défaut
export const resetToDefaultApiUrl = (): void => {
  localStorage.removeItem('customApiUrl');
  console.log("URL d'API réinitialisée à la valeur par défaut");
};
