
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

/**
 * Service pour nettoyer les tables d'un utilisateur lors de sa suppression
 */

/**
 * Supprime toutes les tables associées à un utilisateur
 * @param userId - L'identifiant technique de l'utilisateur
 * @returns Promise<boolean> - Vrai si la suppression a réussi
 */
export const cleanupUserTables = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Début du nettoyage des tables pour l'utilisateur: ${userId}`);
    
    if (!userId || !userId.startsWith('p71x6d_')) {
      console.error(`Identifiant utilisateur invalide: ${userId}`);
      return false;
    }
    
    const API_URL = getApiUrl();
    
    // Enregistrer une trace pour le débogage
    console.log(`Envoi de la requête de nettoyage à ${API_URL}/cleanup-user-tables.php`);
    console.log(`Headers: ${JSON.stringify(getAuthHeaders())}`);
    console.log(`Données: ${JSON.stringify({
      userId,
      action: 'cleanup',
      confirmDelete: true,
      timestamp: new Date().toISOString()
    })}`);
    
    const response = await fetch(`${API_URL}/cleanup-user-tables.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        action: 'cleanup',
        confirmDelete: true,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erreur lors du nettoyage des tables: ${errorData.message || response.statusText}`);
      console.error(`Détails de la réponse: ${JSON.stringify(errorData)}`);
      console.error(`Code HTTP: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    console.log(`Résultat du nettoyage des tables: ${JSON.stringify(result)}`);
    
    if (result.success === true) {
      // Nettoyage du stockage local pour éviter les problèmes de synchronisation
      cleanupUserLocalStorage(userId);
      return true;
    } else {
      console.error(`Le nettoyage a échoué pour l'utilisateur ${userId}: ${result.message || "Erreur non précisée"}`);
      return false;
    }
  } catch (error) {
    console.error(`Erreur lors du nettoyage des tables utilisateur: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

/**
 * Nettoie les données locales de l'utilisateur après sa suppression
 * @param userId - L'identifiant technique de l'utilisateur
 */
const cleanupUserLocalStorage = (userId: string): void => {
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
