
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

/**
 * Service pour nettoyer les données locales d'un utilisateur
 */

/**
 * Supprime toutes les données locales associées à un utilisateur
 * @param userId - L'identifiant technique de l'utilisateur
 */
export const cleanupUserLocalStorage = (userId: string): void => {
  try {
    console.log(`Nettoyage du stockage local pour l'utilisateur: ${userId}`);
    
    // Liste des préfixes pour les données de l'utilisateur spécifique
    const userPrefixes = [
      `membres_${userId}`,
      `documents_${userId}`,
      `collaboration_${userId}`,
      `sync_in_progress_${userId}`,
      `last_sync_id_${userId}`,
      `sync_pending_${userId}`,
      `last_synced_${userId}`,
      `lastServerSync_${userId}`
    ];
    
    // Parcourir toutes les clés du localStorage et sessionStorage
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);
    
    let keysRemoved = 0;
    
    // Supprimer les données de localStorage
    localStorageKeys.forEach(key => {
      const shouldRemove = userPrefixes.some(prefix => key.startsWith(prefix)) || key === userId;
      if (shouldRemove) {
        localStorage.removeItem(key);
        console.log(`Clé supprimée de localStorage: ${key}`);
        keysRemoved++;
      }
    });
    
    // Supprimer les données de sessionStorage
    sessionStorageKeys.forEach(key => {
      const shouldRemove = userPrefixes.some(prefix => key.startsWith(prefix)) || key === userId;
      if (shouldRemove) {
        sessionStorage.removeItem(key);
        console.log(`Clé supprimée de sessionStorage: ${key}`);
        keysRemoved++;
      }
    });
    
    console.log(`Nettoyage du stockage local terminé: ${keysRemoved} clés supprimées`);
  } catch (error) {
    console.error(`Erreur lors du nettoyage du stockage local: ${error instanceof Error ? error.message : String(error)}`);
  }
};
