
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from './databaseConnectionService';

/**
 * Valide un identifiant utilisateur et affiche un toast si nécessaire
 * @param userId - L'identifiant à valider (peut être undefined ou null)
 * @param serviceName - Le nom du service qui fait la validation (pour le logging)
 * @returns L'identifiant validé
 */
export const validateUserId = (userId: string | undefined | null, serviceName: string): string => {
  // Si l'ID est undefined ou null, utiliser getCurrentUser()
  if (userId === undefined || userId === null) {
    const currentUser = getCurrentUser();
    console.log(`${serviceName}: ID utilisateur non fourni, utilisation de l'ID courant: ${currentUser}`);
    return currentUser;
  }
  
  // Si l'ID est une chaîne vide, utiliser getCurrentUser() avec avertissement
  if (typeof userId === 'string' && userId.trim() === '') {
    const currentUser = getCurrentUser();
    console.warn(`${serviceName}: ID utilisateur vide, utilisation de l'ID courant: ${currentUser}`);
    
    // Afficher un toast d'avertissement pour les développeurs
    if (process.env.NODE_ENV === 'development') {
      toast({
        variant: "default",
        title: "Attention",
        description: `ID utilisateur vide détecté dans ${serviceName}, utilisation de l'ID courant: ${currentUser}`
      });
    }
    
    return currentUser;
  }
  
  // Si l'ID est une chaîne, la retourner (validation réussie)
  if (typeof userId === 'string') {
    return userId;
  }
  
  // Si on arrive ici, l'ID est d'un type non supporté, utiliser getCurrentUser() avec erreur
  const currentUser = getCurrentUser();
  console.error(`${serviceName}: Type d'ID utilisateur non supporté (${typeof userId}), utilisation de l'ID courant: ${currentUser}`);
  
  // Afficher un toast d'erreur pour les développeurs
  if (process.env.NODE_ENV === 'development') {
    toast({
      variant: "destructive",
      title: "Erreur",
      description: `Type d'ID utilisateur non supporté dans ${serviceName}, utilisation de l'ID courant: ${currentUser}`
    });
  }
  
  return currentUser;
};

/**
 * Applique une fonction à un identifiant utilisateur validé
 * @param userId - L'identifiant à valider
 * @param serviceName - Le nom du service
 * @param fn - La fonction à appliquer à l'identifiant validé
 * @returns Le résultat de la fonction
 */
export const withValidUserId = <T>(
  userId: string | undefined | null, 
  serviceName: string, 
  fn: (validUserId: string) => T
): T => {
  const validUserId = validateUserId(userId, serviceName);
  return fn(validUserId);
};

/**
 * Crée une clé de stockage local pour un utilisateur spécifique
 * @param baseKey - La clé de base
 * @param userId - L'identifiant utilisateur (optionnel)
 * @returns La clé complète avec l'identifiant utilisateur
 */
export const getUserStorageKey = (baseKey: string, userId?: string): string => {
  const validUserId = userId ? validateUserId(userId, 'getUserStorageKey') : getCurrentUser();
  return `${baseKey}_${validUserId}`;
};

/**
 * Crée une clé d'API pour un utilisateur spécifique
 * @param endpoint - L'endpoint de l'API
 * @param userId - L'identifiant utilisateur (optionnel)
 * @returns L'URL de l'API avec l'identifiant utilisateur
 */
export const getUserApiEndpoint = (endpoint: string, userId?: string): string => {
  const validUserId = userId ? validateUserId(userId, 'getUserApiEndpoint') : getCurrentUser();
  
  // Si l'endpoint contient déjà un ?, ajouter & avant userId
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}userId=${encodeURIComponent(validUserId)}`;
};
