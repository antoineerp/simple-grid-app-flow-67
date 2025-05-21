
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { Utilisateur } from '@/types/auth';
import { getCurrentUser } from '../core/databaseConnectionService';

// Un cache pour les utilisateurs (en mémoire seulement, pas dans localStorage)
let usersCache: Utilisateur[] | null = null;
let lastFetchTimestamp: number | null = null;
const CACHE_DURATION = 30000; // 30 secondes de cache seulement
const MAX_RETRIES = 2; // Maximum de tentatives de récupération

/**
 * Service centralisé pour la gestion des utilisateurs
 */
export const UserManager = {
  /**
   * Récupère tous les utilisateurs avec gestion de cache
   */
  async getUtilisateurs(forceRefresh: boolean = false, retryCount = 0): Promise<Utilisateur[]> {
    // Retourner les données du cache si disponibles et pas encore expirées
    if (!forceRefresh && usersCache && lastFetchTimestamp && (Date.now() - lastFetchTimestamp < CACHE_DURATION)) {
      console.log("Utilisation du cache mémoire pour les utilisateurs", usersCache.length);
      return usersCache;
    }

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Récupérer l'identifiant utilisateur courant
      const userId = getCurrentUser();
      const currentApiUrl = getApiUrl();
      
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/test.php?action=users`);
      
      // Utiliser le nouveau endpoint qui fonctionne
      const response = await fetch(`${currentApiUrl}/test.php?action=users`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      let responseText;
      try {
        responseText = await response.text();
        
        if (!responseText || !responseText.trim()) {
          throw new Error("Réponse vide du serveur");
        }
        
        if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
          console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
          throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
        }
      } catch (textError) {
        console.error("Erreur lors de la récupération du texte de la réponse:", textError);
        throw new Error(`Erreur de traitement de la réponse: ${textError instanceof Error ? textError.message : String(textError)}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Données utilisateurs brutes reçues:", data);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError, "Réponse brute:", responseText.substring(0, 200));
        throw new Error(`Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Extraire les utilisateurs selon la structure de la réponse
      let users: Utilisateur[] = [];
      
      if (data && data.records && Array.isArray(data.records)) {
        users = data.records;
      } else if (data && Array.isArray(data)) {
        users = data;
      } else {
        throw new Error("Format de données invalide: aucun utilisateur trouvé");
      }
      
      // Mettre à jour le cache mémoire
      usersCache = users;
      lastFetchTimestamp = Date.now();
      
      return users;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      
      // Si ce n'est pas la dernière tentative, réessayer
      if (retryCount < MAX_RETRIES) {
        console.log(`Tentative ${retryCount + 1}/${MAX_RETRIES} de récupération des utilisateurs...`);
        // Attendre un peu avant de réessayer (temps exponentiel)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getUtilisateurs(forceRefresh, retryCount + 1);
      }
      
      // En cas d'échec après toutes les tentatives, retourner liste vide
      console.error("Toutes les tentatives de récupération des utilisateurs ont échoué");
      return [];
    }
  },
  
  /**
   * Récupère les tables d'un utilisateur spécifique
   */
  async getUserTables(userId: string): Promise<string[]> {
    try {
      const currentApiUrl = getApiUrl();
      
      console.log(`Récupération des tables pour l'utilisateur ${userId}`);
      
      const response = await fetch(`${currentApiUrl}/test.php?action=tables&userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      console.log("Données de tables reçues:", data);
      
      if (!data.tables || !Array.isArray(data.tables)) {
        console.warn("Aucune table trouvée pour l'utilisateur", userId);
        return [];
      }
      
      return data.tables;
    } catch (error) {
      console.error(`Erreur lors de la récupération des tables pour l'utilisateur ${userId}:`, error);
      return [];
    }
  },
  
  /**
   * Effacer le cache d'utilisateurs
   */
  clearCache() {
    usersCache = null;
    lastFetchTimestamp = null;
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
  }
};

// Export des fonctions simplifiées
export const getUtilisateurs = (forceRefresh: boolean = false): Promise<Utilisateur[]> => {
  return UserManager.getUtilisateurs(forceRefresh);
};

export const getUserTables = (userId: string): Promise<string[]> => {
  return UserManager.getUserTables(userId);
};

export const clearUsersCache = (): void => {
  UserManager.clearCache();
};
