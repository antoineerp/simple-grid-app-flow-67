
import { getApiUrl } from '@/config/apiConfig';

// Configuration fixe pour Infomaniak
const DB_CONFIG = {
  host: "p71x6d.myd.infomaniak.com",
  dbname: "p71x6d_system", 
  username: "p71x6d_richard",
  password: "Trottinette43!"
};

/**
 * Service unique pour toutes les interactions avec la base de données Infomaniak
 */
export class DatabaseService {
  private static instance: DatabaseService;
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Exécute une requête vers l'API
   */
  private async executeQuery(endpoint: string, params?: any): Promise<any> {
    const apiUrl = getApiUrl();
    const url = params 
      ? `${apiUrl}/${endpoint}?${new URLSearchParams(params).toString()}&_t=${Date.now()}`
      : `${apiUrl}/${endpoint}?_t=${Date.now()}`;

    console.log(`[DB] Exécution de la requête: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      
      // Vérifier si la réponse contient du PHP brut
      if (text.includes('<?php') || text.includes('<br />')) {
        console.error("Réponse PHP brute détectée:", text.substring(0, 200));
        throw new Error("Le serveur retourne du PHP au lieu de JSON");
      }

      const data = JSON.parse(text);
      console.log(`[DB] Réponse reçue:`, data);
      return data;
    } catch (error) {
      console.error(`[DB] Erreur lors de la requête ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Récupère tous les utilisateurs depuis la base de données
   */
  async getUsers(): Promise<any[]> {
    try {
      const data = await this.executeQuery('check-users.php');
      return data.records || data.users || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return [];
    }
  }

  /**
   * Récupère les tables d'un utilisateur spécifique
   */
  async getUserTables(userId: string): Promise<string[]> {
    try {
      const data = await this.executeQuery('test.php', { 
        action: 'tables', 
        userId: userId 
      });
      return data.tables || [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des tables pour ${userId}:`, error);
      return [];
    }
  }

  /**
   * Vérifie si un utilisateur existe dans la base de données
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const users = await this.getUsers();
      return users.some(user => 
        user.identifiant_technique === userId || 
        user.email === userId
      );
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'utilisateur ${userId}:`, error);
      return false;
    }
  }

  /**
   * Teste la connexion à la base de données
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.executeQuery('test.php');
      return {
        success: data.status === 'success',
        message: data.message || 'Connexion réussie'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion'
      };
    }
  }
}

export const db = DatabaseService.getInstance();
