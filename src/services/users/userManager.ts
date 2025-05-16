import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getDatabaseConnectionCurrentUser } from '../core/databaseConnectionService';
import { getDeviceId } from '../core/userService';
import { Utilisateur } from '@/types/user';

// Un cache pour les utilisateurs
let usersCache: Utilisateur[] | null = null;
let lastFetchTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute de cache

/**
 * Service centralisé pour la gestion des utilisateurs
 * Avec support multi-appareils et synchronisation
 */
export const UserManager = {
  /**
   * Récupère tous les utilisateurs avec gestion de cache
   */
  async getUtilisateurs(forceRefresh: boolean = false): Promise<Utilisateur[]> {
    // Retourner les données du cache si disponibles et pas encore expirées
    if (!forceRefresh && usersCache && lastFetchTimestamp && (Date.now() - lastFetchTimestamp < CACHE_DURATION)) {
      console.log("Utilisation du cache pour les utilisateurs", usersCache.length);
      return usersCache;
    }

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error("Utilisateur non authentifié");
      }
      
      const currentDatabaseUser = getDatabaseConnectionCurrentUser();
      const currentApiUrl = getApiUrl();
      const currentDeviceId = getDeviceId();
      
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/check-users?source=${currentDatabaseUser}&deviceId=${currentDeviceId}`);
      
      // Utiliser uniquement le endpoint check-users qui est le plus fiable
      // Ajouter l'ID de l'appareil pour permettre la synchronisation côté serveur
      const response = await fetch(`${currentApiUrl}/check-users?source=${currentDatabaseUser}&deviceId=${currentDeviceId}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Device-ID': currentDeviceId // En-tête spécifique pour le suivi multi-appareils
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (!responseText || !responseText.trim()) {
        throw new Error("Réponse vide du serveur");
      }
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      
      // Extraire les utilisateurs selon la structure de la réponse
      let users: Utilisateur[] = [];
      
      if (data && data.records && Array.isArray(data.records)) {
        users = data.records;
      } else if (data && Array.isArray(data)) {
        users = data;
      } else {
        throw new Error("Format de données invalide: aucun utilisateur trouvé");
      }
      
      // Mettre à jour le cache
      usersCache = users;
      lastFetchTimestamp = Date.now();
      
      // Sauvegarder les données dans le localStorage pour utilisation hors ligne
      localStorage.setItem('users_cache', JSON.stringify({
        timestamp: lastFetchTimestamp,
        data: users,
        deviceId: currentDeviceId
      }));
      
      return users;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      
      // En cas d'erreur, essayer de récupérer depuis le cache local
      const cachedData = localStorage.getItem('users_cache');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed && Array.isArray(parsed.data)) {
            console.log("Utilisation du cache local pour les utilisateurs après erreur");
            return parsed.data;
          }
        } catch (e) {
          console.error("Erreur lors de la lecture du cache utilisateurs:", e);
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Effacer le cache d'utilisateurs
   */
  clearCache() {
    usersCache = null;
    lastFetchTimestamp = null;
    localStorage.removeItem('users_cache');
    console.log("Cache utilisateurs effacé");
  },
  
  /**
   * Vérifie si un utilisateur avec le rôle spécifié existe
   */
  async hasUserWithRole(role: string): Promise<boolean> {
    try {
      const users = await this.getUtilisateurs();
      return users.some(user => user.role === role);
    } catch (error) {
      console.error(`Erreur lors de la vérification des utilisateurs avec rôle ${role}:`, error);
      return false;
    }
  },
  
  /**
   * Synchronise les données utilisateur avec le serveur
   */
  async synchronize(): Promise<boolean> {
    try {
      await this.getUtilisateurs(true); // Force un rechargement
      return true;
    } catch (error) {
      console.error("Échec de synchronisation des utilisateurs:", error);
      return false;
    }
  }
};

// Export des fonctions simplifiées
export const getUtilisateurs = (forceRefresh: boolean = false): Promise<Utilisateur[]> => {
  return UserManager.getUtilisateurs(forceRefresh);
};

export const clearUsersCache = (): void => {
  UserManager.clearCache();
};

export const synchronizeUsers = (): Promise<boolean> => {
  return UserManager.synchronize();
};
