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
  
  private constructor() {
    console.log('DatabaseHelper initialisé');
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
      const currentUser = userId || getCurrentUser() || 'p71x6d_system';
      const API_URL = getApiUrl();
      const safeUserId = encodeURIComponent(currentUser);
      
      console.log(`Demande de mise à jour de la structure pour l'utilisateur ${safeUserId}`);
      
      // Utiliser une seule méthode de connexion avec gestion d'erreur robuste
      let response;
      try {
        response = await fetch(`${API_URL}/db-update.php?userId=${safeUserId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      } catch (error) {
        console.error("Erreur de connexion:", error);
        throw new Error("Impossible de se connecter au serveur de base de données");
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
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
}

// Export d'une instance singleton
export const databaseHelper = DatabaseHelper.getInstance();
