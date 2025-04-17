
// Configuration des URLs de l'API selon l'environnement
const API_CONFIG = {
  development: 'https://votre-domaine.com/api',
  production: 'https://votre-domaine-production.com/api'
};

export const getApiUrl = () => {
  return import.meta.env.MODE === 'production' 
    ? API_CONFIG.production 
    : API_CONFIG.development;
};
