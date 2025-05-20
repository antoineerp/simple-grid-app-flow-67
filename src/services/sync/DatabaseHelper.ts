
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

export interface DatabaseUpdateResult {
  success: boolean;
  message: string;
  tables_created?: string[];
  tables_updated?: string[];
  error_type?: string;
  timestamp?: string;
}

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private lastUpdateCheck: Record<string, Date> = {};
  private apiUrl: string;
  
  private constructor() {
    console.log('DatabaseHelper initialisé');
    this.apiUrl = getApiUrl();
  }
  
  public static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }
  
  /**
   * Vérifie et met à jour la structure de la base de données
   * @param userId ID utilisateur (optionnel)
   * @param showToast Afficher les notifications toast (optionnel)
   */
  public async updateDatabaseStructure(
    userId?: string, 
    showToast: boolean = true
  ): Promise<DatabaseUpdateResult> {
    try {
      const currentUser = userId || getCurrentUser() || 'p71x6d_richard';
      const API_URL = this.apiUrl;
      const safeUserId = encodeURIComponent(currentUser);
      
      console.log(`Demande de mise à jour de la structure pour l'utilisateur ${safeUserId}`);
      
      // Utiliser la méthode de connexion qui fonctionnait correctement
      let response;
      try {
        const endpoint = `${API_URL}/db-update.php`;
        console.log(`Connexion à: ${endpoint}?userId=${safeUserId}`);
        
        response = await fetch(`${endpoint}?userId=${safeUserId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Accept': 'application/json'
          }
        });
      } catch (error) {
        console.error("Erreur de connexion:", error);
        throw new Error("Impossible de se connecter au serveur de base de données");
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Enregistrer la date de mise à jour
      this.lastUpdateCheck[currentUser] = new Date();
      
      // Notification de succès
      if (showToast && result.success) {
        const createdCount = result.tables_created?.length || 0;
        const updatedCount = result.tables_updated?.length || 0;
        
        toast({
          title: "Mise à jour de la structure",
          description: `${createdCount} table(s) créée(s) et ${updatedCount} table(s) mise(s) à jour`,
        });
      }
      
      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la structure:", error);
      
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Erreur de mise à jour",
          description: error instanceof Error ? error.message : "Erreur inconnue"
        });
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  }
  
  /**
   * Vérifie si une table existe et contient les bonnes colonnes
   * @param tableName Nom de la table
   * @param userId ID utilisateur (optionnel)
   * @param force Forcer la mise à jour (optionnel)
   */
  public async validateTable(
    tableName: string, 
    userId?: string,
    force: boolean = false
  ): Promise<boolean> {
    try {
      const currentUser = userId || getCurrentUser() || 'p71x6d_system';
      
      // Vérifier si on a déjà fait une mise à jour récemment (moins d'une minute)
      const lastUpdate = this.lastUpdateCheck[currentUser];
      const now = new Date();
      
      if (!force && lastUpdate && (now.getTime() - lastUpdate.getTime() < 60000)) {
        console.log(`Validation de table ignorée pour ${tableName}, dernière vérification récente`);
        return true;
      }
      
      // Mettre à jour la structure
      const updateResult = await this.updateDatabaseStructure(currentUser, false);
      
      if (updateResult.success) {
        const tableFullName = `${tableName}_${currentUser}`;
        
        // Vérifier si la table a été créée ou mise à jour
        const createdTables = updateResult.tables_created || [];
        const updatedTables = updateResult.tables_updated || [];
        
        if (createdTables.includes(tableFullName) || updatedTables.includes(tableFullName)) {
          console.log(`Table ${tableFullName} validée avec succès`);
          return true;
        }
        
        // Si la table n'est pas mentionnée, c'est qu'elle existait déjà et n'a pas eu besoin de mise à jour
        return true;
      }
      
      // Afficher une notification si la validation échoue
      toast({
        title: "Validation de structure",
        description: updateResult.message || `Erreur de validation pour la table ${tableName}`,
        variant: "destructive"
      });
      
      return false;
    } catch (error) {
      console.error("Erreur lors de la validation de la table:", error);
      return false;
    }
  }
  
  /**
   * Force une mise à jour de toutes les tables
   */
  public async forceUpdateAllTables(): Promise<DatabaseUpdateResult> {
    return this.updateDatabaseStructure(undefined, true);
  }
  
  /**
   * Effectue une requête HTTP avec gestion des erreurs améliorée
   * @param url URL de la requête
   * @param options Options fetch
   * @returns Réponse
   */
  public async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Assurer que les options de base sont définies
      const defaultOptions: RequestInit = {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      };
      
      // Fusionner les options par défaut avec celles fournies
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...(options.headers || {})
        }
      };
      
      // CORRECTION: Remplacer toutes les URL qui utilisent database-config.php par check-users.php
      let modifiedUrl = url;
      
      if (url.includes('database-config.php')) {
        // Utiliser l'URL fonctionnelle pour la configuration de la base de données
        modifiedUrl = `${this.apiUrl}/check-users.php`;
        console.log(`URL modifiée: database-config.php -> check-users.php: ${modifiedUrl}`);
      } else if (!url.includes('check-users.php') && (url.includes('database') || url.includes('db-'))) {
        // Pour tout autre appel lié à la base de données, utiliser check-users.php
        modifiedUrl = `${this.apiUrl}/check-users.php`;
        console.log(`URL database généralisée vers check-users.php: ${modifiedUrl}`);
      }
      
      console.log(`DatabaseHelper: Requête HTTP vers ${modifiedUrl}`);
      
      // Exécuter la requête
      const response = await fetch(modifiedUrl, mergedOptions);
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Erreur lors de la requête:`, error);
      throw error;
    }
  }
}

// Export d'une instance singleton
export const databaseHelper = DatabaseHelper.getInstance();
