
/**
 * Gestionnaire central de la connexion à la base de données
 * Assure que toutes les opérations utilisent p71x6d_richard
 */

import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/hooks/use-toast';

// Constantes pour la base de données
const DB_USER = 'p71x6d_richard';
const DB_NAME = 'p71x6d_system';

/**
 * Crée un utilisateur en utilisant strictement la table utilisateurs_p71x6d_richard
 * @param {Object} userData - Les données de l'utilisateur à créer
 * @returns {Promise<Object>} - Le résultat de la création
 */
export const createDbUser = async (userData) => {
  try {
    const apiUrl = getApiUrl();
    console.log(`Création d'un utilisateur avec la base ${DB_USER} dans ${DB_NAME}`, userData);
    
    // Appel à l'API pour créer l'utilisateur
    const response = await fetch(`${apiUrl}/users.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'X-Forced-DB-User': DB_USER,
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}:`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Erreur ${response.status}`);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur inconnue'}`);
        }
        throw e;
      }
    }
    
    const data = await response.json();
    
    if (data.status === 'error' || !data.success) {
      console.error('Erreur de création utilisateur:', data);
      throw new Error(data.message || "Échec de la création de l'utilisateur");
    }
    
    console.log('Utilisateur créé avec succès:', data);
    
    // Créer explicitement les tables pour cet utilisateur
    if (data.user?.identifiant_technique) {
      await ensureUserTables(data.user.identifiant_technique);
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    toast({
      variant: "destructive",
      title: "Erreur création utilisateur",
      description: error.message || "Une erreur inconnue est survenue"
    });
    
    return {
      success: false,
      error: true,
      message: error.message || "Une erreur inconnue est survenue"
    };
  }
};

/**
 * S'assure que toutes les tables nécessaires sont créées pour un utilisateur
 * @param {string} userId - L'identifiant technique de l'utilisateur
 * @returns {Promise<Object>} - Le résultat de la création des tables
 */
export const ensureUserTables = async (userId) => {
  try {
    const apiUrl = getApiUrl();
    console.log(`Vérification des tables pour l'utilisateur ${userId}`);
    
    const response = await fetch(`${apiUrl}/users.php?action=create_tables_for_user&userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'X-Forced-DB-User': DB_USER,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error' || !data.success) {
      console.error('Erreur de création des tables:', data);
      throw new Error(data.message || "Échec de la création des tables");
    }
    
    console.log('Tables créées avec succès:', data);
    return data;
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
    return {
      success: false,
      error: true,
      message: error.message || "Une erreur inconnue est survenue"
    };
  }
};

/**
 * Vérifie que toutes les tables des utilisateurs existent
 * @returns {Promise<Object>} - Le résultat de la vérification
 */
export const verifyAllUserTables = async () => {
  try {
    const apiUrl = getApiUrl();
    console.log('Vérification de toutes les tables utilisateurs');
    
    const response = await fetch(`${apiUrl}/users.php?action=ensure_tables`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'X-Forced-DB-User': DB_USER,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error' || !data.success) {
      console.error('Erreur de vérification des tables:', data);
      throw new Error(data.message || "Échec de la vérification des tables");
    }
    
    console.log('Tables vérifiées avec succès:', data);
    return data;
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
    return {
      success: false,
      error: true,
      message: error.message || "Une erreur inconnue est survenue"
    };
  }
};

/**
 * Teste la connexion à la base de données
 * @returns {Promise<Object>} - Le résultat du test
 */
export const testDatabaseConnection = async () => {
  try {
    const apiUrl = getApiUrl();
    console.log('Test de connexion à la base de données');
    
    const response = await fetch(`${apiUrl}/diagnose-connection.php`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Test de connexion réussi:', data);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
    return {
      success: false,
      error: true,
      message: error.message || "Une erreur inconnue est survenue"
    };
  }
};
