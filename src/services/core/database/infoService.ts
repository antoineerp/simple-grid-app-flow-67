
import { getAuthHeaders } from '@/services/auth/authService';
import { validateJsonResponse, showToast, getBaseUrl, formatDatabaseInfo } from './utils';
import type { DatabaseInfo } from './types';
import { getCurrentUser } from './connectionService';

class DatabaseInfoService {
  private static instance: DatabaseInfoService;

  private constructor() {}

  public static getInstance(): DatabaseInfoService {
    if (!DatabaseInfoService.instance) {
      DatabaseInfoService.instance = new DatabaseInfoService();
    }
    return DatabaseInfoService.instance;
  }

  public async getDatabaseInfo(): Promise<DatabaseInfo> {
    try {
      console.log("Récupération des informations sur la base de données...");
      
      // Vérifier d'abord si un utilisateur est connecté
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return this.getOfflineInfo();
      }
      
      const response = await fetch(`${getBaseUrl()}/database-test`, {
        method: 'GET',
        headers: { 
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Impossible de récupérer les informations de la base de données (${response.status})`);
      }
      
      const responseText = await response.text();
      const data = await validateJsonResponse(responseText);
      
      if (data.status !== 'success') {
        throw new Error(data.error || data.message || "Impossible de récupérer les informations de la base de données");
      }
      
      if (data.info) {
        return formatDatabaseInfo(data.info);
      }
      
      throw new Error("Aucune information sur la base de données n'a été reçue");
    } catch (error) {
      console.error("Error retrieving database info:", error);
      
      const currentUser = getCurrentUser();
      if (currentUser) {
        return {
          host: `${currentUser}.myd.infomaniak.com`,
          database: currentUser,
          size: "Information non disponible",
          tables: 0,
          lastBackup: "N/A",
          status: "Online",
          encoding: "UTF-8",
          collation: "utf8mb4_unicode_ci",
          tableList: []
        };
      }
      
      showToast("Erreur", "Impossible de récupérer les informations de la base de données.", "destructive");
      return this.getOfflineInfo();
    }
  }

  private getOfflineInfo(): DatabaseInfo {
    return {
      host: "Non connecté",
      database: "Non connecté",
      size: "N/A",
      tables: 0,
      lastBackup: "N/A",
      status: "Offline",
      encoding: "N/A",
      collation: "N/A",
      tableList: []
    };
  }
}

const databaseInfoService = DatabaseInfoService.getInstance();

export const getDatabaseInfo = (): Promise<DatabaseInfo> => {
  return databaseInfoService.getDatabaseInfo();
};
