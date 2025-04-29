
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';
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
  
  private constructor() {
    console.log('Service DatabaseHelper initialisé');
  }
  
  public static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }
  
  /**
   * Vérifie et met à jour la structure de la base de données
   */
  public async updateDatabaseStructure(userId?: string): Promise<DatabaseUpdateResult> {
    try {
      const currentUser = userId || getCurrentUser() || 'p71x6d_system';
      const API_URL = getApiUrl();
      const safeUserId = encodeURIComponent(currentUser);
      
      console.log(`Demande de mise à jour de la structure pour l'utilisateur ${safeUserId}`);
      
      const response = await fetch(`${API_URL}/db-update.php?userId=${safeUserId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        // Essayer avec une URL alternative
        try {
          const alternativeUrl = `/sites/qualiopi.ch/api/db-update.php`;
          console.log(`Tentative avec URL alternative: ${alternativeUrl}`);
          
          const alternativeResponse = await fetch(`${alternativeUrl}?userId=${safeUserId}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          if (!alternativeResponse.ok) {
            throw new Error(`Erreur HTTP: ${alternativeResponse.status}`);
          }
          
          const result = await alternativeResponse.json();
          return result;
        } catch (altError) {
          console.error("Erreur avec l'URL alternative:", altError);
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la structure:", error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  }
  
  /**
   * Vérifie si une table existe et contient les bonnes colonnes
   */
  public async validateTable(tableName: string, userId?: string): Promise<boolean> {
    try {
      const currentUser = userId || getCurrentUser() || 'p71x6d_system';
      // Mettre à jour la structure pour s'assurer que la table est correcte
      const updateResult = await this.updateDatabaseStructure(currentUser);
      
      if (updateResult.success) {
        const tableFullName = `${tableName}_${currentUser}`;
        
        // Vérifier si la table a été créée ou mise à jour
        const createdTables = updateResult.tables_created || [];
        const updatedTables = updateResult.tables_updated || [];
        
        if (createdTables.includes(tableFullName) || updatedTables.includes(tableFullName)) {
          console.log(`Table ${tableFullName} validée avec succès`);
          return true;
        }
      }
      
      // Afficher une notification si la validation échoue
      toast({
        title: "Validation de structure",
        description: updateResult.success ? 
          `La table ${tableName} existe mais n'a pas été mise à jour` : 
          updateResult.message,
        variant: "destructive"
      });
      
      return false;
    } catch (error) {
      console.error("Erreur lors de la validation de la table:", error);
      return false;
    }
  }
}

// Export d'une instance singleton
export const databaseHelper = DatabaseHelper.getInstance();
