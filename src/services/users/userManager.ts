
import { db } from '@/services/database';
import type { Utilisateur } from '@/types/auth';

/**
 * Service simplifié pour la gestion des utilisateurs
 * Utilise le service de base de données centralisé
 */

/**
 * Récupère la liste des utilisateurs depuis la base de données
 */
export const getUtilisateurs = async (forceRefresh = false): Promise<Utilisateur[]> => {
  try {
    console.log('Récupération des utilisateurs depuis la base de données...');
    const users = await db.getUsers();
    console.log(`${users.length} utilisateurs récupérés de la base de données`);
    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

/**
 * S'assure que toutes les tables utilisateur existent
 */
export const ensureAllUserTablesExist = async (): Promise<any[]> => {
  try {
    console.log('Vérification des tables pour tous les utilisateurs...');
    const users = await db.getUsers();
    const results = [];
    
    for (const user of users) {
      const tables = await db.getUserTables(user.identifiant_technique);
      results.push({
        user: user.identifiant_technique,
        tables: tables,
        count: tables.length
      });
    }
    
    return results;
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
    return [];
  }
};

/**
 * Efface le cache des utilisateurs (pour compatibilité)
 */
export const clearUsersCache = (): void => {
  console.log('Cache des utilisateurs effacé');
  // Note: Le nouveau service n'utilise pas de cache
};
