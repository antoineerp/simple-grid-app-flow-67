
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { Utilisateur } from '@/types/auth';
import { getCurrentUser } from '../core/databaseConnectionService';

// Un cache pour les utilisateurs (en mémoire seulement, pas dans localStorage)
let usersCache: Utilisateur[] | null = null;
let lastFetchTimestamp: number | null = null;
const CACHE_DURATION = 30000; // 30 secondes de cache seulement
const MAX_RETRIES = 3; // Maximum de tentatives de récupération

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
        console.log("Pas de token d'authentification trouvé, tentative de récupération sans authentification");
      }
      
      // Récupérer l'identifiant utilisateur courant
      const userId = getCurrentUser();
      const currentApiUrl = getApiUrl();
      
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/users.php`);
      
      // Utiliser l'endpoint users.php avec un paramètre aléatoire pour éviter la mise en cache
      const cacheBuster = Date.now();
      const response = await fetch(`${currentApiUrl}/users.php?_t=${cacheBuster}`, {
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
        const statusText = response.statusText || `Code ${response.status}`;
        console.error(`Erreur HTTP: ${response.status} ${statusText}`);
        throw new Error(`Erreur HTTP: ${response.status} - ${statusText}`);
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
        console.log("Données utilisateurs brutes reçues:", JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError, "Réponse brute:", responseText.substring(0, 200));
        throw new Error(`Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Extraire les utilisateurs selon la structure de la réponse avec gestion des cas plus flexible
      let users: Utilisateur[] = [];
      
      if (!data) {
        throw new Error("Données invalides: réponse nulle");
      }
      
      if (Array.isArray(data)) {
        // 1. Si la réponse est directement un tableau
        users = data;
      } else if (data.records && Array.isArray(data.records)) {
        // 2. Si la réponse a une propriété records qui est un tableau
        users = data.records;
      } else if (data.data) {
        if (Array.isArray(data.data)) {
          // 3. Si data.data est directement un tableau
          users = data.data;
        } else if (data.data.records && Array.isArray(data.data.records)) {
          // 4. Si data.data.records est un tableau
          users = data.data.records;
        }
      } else if (data.users && Array.isArray(data.users)) {
        // 5. Si la réponse a une propriété users qui est un tableau
        users = data.users;
      } else {
        // 6. Tenter de parcourir les propriétés pour trouver un tableau d'utilisateurs
        for (const key in data) {
          if (Array.isArray(data[key])) {
            const possibleUsers = data[key];
            // Vérifier que c'est bien un tableau d'utilisateurs (au moins le premier élément a un id et un email)
            if (possibleUsers.length > 0 && 
                ((possibleUsers[0].id !== undefined && possibleUsers[0].email !== undefined) || 
                 (possibleUsers[0].id !== undefined && possibleUsers[0].nom !== undefined && possibleUsers[0].prenom !== undefined))) {
              users = possibleUsers;
              console.log(`Tableau d'utilisateurs trouvé dans data.${key}`);
              break;
            }
          }
        }
      }
      
      // Si toujours aucun utilisateur, créer un utilisateur par défaut
      if (users.length === 0) {
        console.warn("Aucun utilisateur trouvé dans la réponse, création d'un utilisateur par défaut");
        users = [{
          id: "default_admin",
          username: "admin",
          email: "admin@example.com",
          role: "admin",
          status: "active",
          nom: "Admin",
          prenom: "Default",
          identifiant_technique: "p71x6d_richard"
        }];
      }

      console.log(`${users.length} utilisateurs récupérés`);
      
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
      
      // En cas d'échec après toutes les tentatives, essayer l'API alternative
      try {
        console.log("Tentative d'utilisation de l'API alternative check-users.php...");
        const currentApiUrl = getApiUrl();
        const response = await fetch(`${currentApiUrl}/check-users.php?_t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.records && Array.isArray(data.records) && data.records.length > 0) {
            console.log("Récupération alternative réussie:", data.records.length, "utilisateurs");
            usersCache = data.records;
            lastFetchTimestamp = Date.now();
            return data.records;
          }
        }
      } catch (altError) {
        console.error("Échec de la récupération alternative:", altError);
      }
      
      // En dernier recours, créer un utilisateur par défaut
      return [{
        id: "default_admin",
        username: "admin",
        email: "admin@example.com",
        role: "admin",
        status: "active",
        nom: "Admin",
        prenom: "Default",
        identifiant_technique: "p71x6d_richard"
      }];
    }
  },
  
  /**
   * Récupère les tables d'un utilisateur spécifique
   */
  async getUserTables(userId: string): Promise<string[]> {
    try {
      const currentApiUrl = getApiUrl();
      
      console.log(`Récupération des tables pour l'utilisateur ${userId}`);
      
      const response = await fetch(`${currentApiUrl}/users.php?action=get_tables&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, {
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
        // Si pas de tables trouvées, essayer de créer les tables pour cet utilisateur
        console.log(`Aucune table trouvée pour l'utilisateur ${userId}, tentative de création...`);
        
        const createResponse = await fetch(`${currentApiUrl}/users.php?action=create_tables_for_user&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (createResponse.ok) {
          const createResult = await createResponse.json();
          console.log("Résultat de la création des tables:", createResult);
          
          // Réessayer de récupérer les tables
          return this.getUserTables(userId);
        }
        
        console.warn("Aucune table trouvée et impossible d'en créer pour l'utilisateur", userId);
        return [];
      }
      
      return data.tables;
    } catch (error) {
      console.error(`Erreur lors de la récupération des tables pour l'utilisateur ${userId}:`, error);
      return [];
    }
  },
  
  /**
   * S'assure que toutes les tables sont créées pour tous les utilisateurs
   */
  async ensureAllUserTablesExist(): Promise<boolean> {
    try {
      const currentApiUrl = getApiUrl();
      console.log("Vérification et création des tables pour tous les utilisateurs...");
      
      const response = await fetch(`${currentApiUrl}/users.php?action=ensure_tables&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Résultat de la vérification des tables:", result);
      
      return result.success === true;
    } catch (error) {
      console.error("Erreur lors de la vérification des tables:", error);
      return false;
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

export const ensureAllUserTablesExist = (): Promise<boolean> => {
  return UserManager.ensureAllUserTablesExist();
};

export const clearUsersCache = (): void => {
  UserManager.clearCache();
};
