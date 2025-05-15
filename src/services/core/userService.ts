
// Ce fichier est conservé pour la compatibilité avec le code existant
// mais délègue maintenant ses fonctionnalités au nouveau UserManager
import { getUtilisateurs as getUsersFromManager } from './userManager';
import { Utilisateur } from '@/services';

// Export des fonctions simplifiées qui utilisent le UserManager
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  console.log("userService.getUtilisateurs appelé - déléguant à UserManager");
  return getUsersFromManager();
};

// Fonction pour générer un identifiant d'appareil unique s'il n'existe pas
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
    console.log("Nouvel identifiant d'appareil généré:", deviceId);
  }
  return deviceId;
};

// Fonction pour obtenir l'identifiant utilisateur courant
export const getCurrentUserId = (): string => {
  try {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (authToken) {
      // Vérifier que le token a le bon format avant de le traiter
      const parts = authToken.split('.');
      if (parts && parts.length >= 2 && parts[1]) {
        try {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const rawPayload = atob(base64);
          const jsonPayload = decodeURIComponent(
            Array.from(rawPayload)
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );

          const userData = JSON.parse(jsonPayload);
          if (userData.user && userData.user.id) {
            return userData.user.id;
          }
        } catch (decodeError) {
          console.error("Erreur lors du décodage du token:", decodeError);
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID utilisateur:", error);
  }
  
  return '';
};
