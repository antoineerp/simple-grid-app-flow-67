
// Configuration de l'API
export const getApiUrl = (): string => {
  // En environnement de production, utiliser un chemin relatif
  // Cela permettra aux appels d'API de fonctionner indépendamment du domaine
  return '/api';
};
