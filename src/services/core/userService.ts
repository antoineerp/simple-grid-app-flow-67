
import { getCurrentUser } from '@/services/auth/authService';

/**
 * Extrait un identifiant utilisateur valide à partir des informations d'utilisateur
 * Standardise l'approche sur toute l'application
 */
export const getCurrentUserId = (): string => {
  const user = getCurrentUser();
  return extractValidUserId(user);
};

/**
 * Génère ou récupère un identifiant d'appareil unique
 * Cet ID est utilisé pour la synchronisation multi-appareils
 */
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
    console.log("Nouvel identifiant d'appareil généré:", deviceId);
  }
  return deviceId;
};

/**
 * Extrait un identifiant utilisateur valide à partir de différentes formes d'utilisateur
 */
export const extractValidUserId = (user: any): string => {
  // Si aucun utilisateur n'est fourni, utiliser l'ID système par défaut
  if (!user) {
    console.warn("Aucun utilisateur fourni, utilisation de l'ID système");
    return 'p71x6d_system';
  }
  
  // Si c'est déjà une chaîne, la retourner directement
  if (typeof user === 'string') {
    return user;
  }
  
  // Si c'est un objet, essayer d'extraire un identifiant
  if (typeof user === 'object') {
    // Vérifier si l'objet n'est pas null
    if (user === null) {
      console.warn("Objet utilisateur null, utilisation de l'ID système");
      return 'p71x6d_system';
    }
    
    // Identifiants potentiels par ordre de priorité
    const possibleIds = ['identifiant_technique', 'email', 'id'];
    
    for (const idField of possibleIds) {
      if (user[idField] && typeof user[idField] === 'string') {
        console.log(`ID utilisateur extrait: ${idField} = ${user[idField]}`);
        return user[idField];
      }
    }
    
    console.warn("Aucun identifiant valide trouvé dans l'objet utilisateur:", user);
  }
  
  console.warn("Type d'utilisateur non pris en charge, utilisation de l'ID système");
  return 'p71x6d_system';
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isUserLoggedIn = (): boolean => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const user = getCurrentUser();
  return !!token && !!user;
};

/**
 * Génère une chaîne d'identifiant sécurisée pour l'utilisation dans les noms de table
 * Cette fonction est essentielle pour éviter les injections SQL
 */
export const getSafeUserId = (userId?: string): string => {
  const id = userId || getCurrentUserId();
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
};

/**
 * Initialise les informations d'appareil si nécessaire
 * Ces informations sont utilisées pour la synchronisation multi-appareils
 */
export const initDeviceInfo = (): void => {
  // Assurer qu'un ID d'appareil existe
  const deviceId = getDeviceId();
  
  // Enregistrer les informations de l'appareil
  const deviceInfo = {
    id: deviceId,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    lastActive: new Date().toISOString(),
    userId: getCurrentUserId() // Associer l'ID utilisateur à l'appareil
  };
  
  localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
  console.log("Informations d'appareil initialisées:", deviceInfo);
};

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initDeviceInfo();
}
