
// Configuration API

// Récupère l'URL de base de l'API
export const getApiUrl = (): string => {
  // Utilise l'URL actuelle comme base pour l'API
  const baseUrl = window.location.origin;
  return `${baseUrl}/api`;
};

// Récupère les en-têtes d'authentification
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};
