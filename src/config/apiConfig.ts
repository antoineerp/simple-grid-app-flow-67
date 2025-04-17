
// Configuration des URLs de l'API selon l'environnement
const API_CONFIG = {
  development: 'http://localhost:8080/api',
  production: 'https://www.qualiopi.ch/api'
};

// Vérifier si une URL personnalisée a été définie dans le localStorage
export const getApiUrl = () => {
  // Vérifier si une URL personnalisée existe dans le localStorage
  const customApiUrl = localStorage.getItem('customApiUrl');
  
  if (customApiUrl) {
    return customApiUrl;
  }
  
  // Sinon, utiliser la configuration par défaut selon l'environnement
  return import.meta.env.MODE === 'production' 
    ? API_CONFIG.production 
    : API_CONFIG.development;
};

// Fonction pour définir une URL personnalisée
export const setCustomApiUrl = (url: string | null): void => {
  if (url) {
    localStorage.setItem('customApiUrl', url);
  } else {
    localStorage.removeItem('customApiUrl');
  }
};

// Fonction pour réinitialiser à l'URL par défaut
export const resetToDefaultApiUrl = (): void => {
  localStorage.removeItem('customApiUrl');
};

// Obtenir l'URL de base (sans /api) pour les règles CORS
export const getBaseUrl = () => {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/\/api$/, '');
};
