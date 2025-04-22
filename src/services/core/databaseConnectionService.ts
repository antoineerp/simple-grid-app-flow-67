
import { toast } from '@/hooks/use-toast';
import { initializeUserData } from './userInitializationService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// Type for the database information
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
  encoding?: string;
  collation?: string;
  tableList?: string[];
}

// Class for handling database connection
class DatabaseConnectionService {
  private static instance: DatabaseConnectionService;
  private currentUser: string | null = null;

  private constructor() {
    console.log("Database connection service initialized");
    this.currentUser = localStorage.getItem('currentDatabaseUser');
  }

  // Singleton pattern to get the instance
  public static getInstance(): DatabaseConnectionService {
    if (!DatabaseConnectionService.instance) {
      DatabaseConnectionService.instance = new DatabaseConnectionService();
    }
    return DatabaseConnectionService.instance;
  }
  
  // Vérifier et corriger la réponse JSON si nécessaire
  private validateJsonResponse(responseText: string): any {
    try {
      // Essayer d'analyser directement
      return JSON.parse(responseText);
    } catch (e) {
      // Si la réponse commence par <!DOCTYPE, c'est probablement une page HTML
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error("Reçu du HTML au lieu de JSON:", responseText.substring(0, 100) + "...");
        throw new Error("Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la configuration du serveur.");
      }
      
      // Si c'est une autre erreur de parsing, la propager
      throw e;
    }
  }

  // Set the current user
  public setCurrentUser(identifiantTechnique: string | null): void {
    this.currentUser = identifiantTechnique;
    if (identifiantTechnique) {
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      localStorage.setItem('currentUser', identifiantTechnique);
      console.log(`User connected to the database: ${identifiantTechnique}`);
    } else {
      localStorage.removeItem('currentDatabaseUser');
      console.log('User disconnected from the database');
    }
  }

  // Get the current user
  public getCurrentUser(): string | null {
    if (!this.currentUser) {
      this.currentUser = localStorage.getItem('currentDatabaseUser');
    }
    return this.currentUser;
  }

  // Connect as specific user
  public async connectAsUser(identifiantTechnique: string): Promise<boolean> {
    try {
      console.log(`Attempting to connect as ${identifiantTechnique}...`);
      
      // Set the current user
      this.setCurrentUser(identifiantTechnique);
      
      // Vérifier si la connexion à la base de données est possible
      const isConnected = await this.testConnection();
      
      if (!isConnected) {
        throw new Error("Impossible de se connecter à la base de données");
      }
      
      // Initialize user data if needed
      await initializeUserData(identifiantTechnique);
      
      toast({
        title: "Connexion réussie",
        description: `Vous êtes maintenant connecté en tant que ${identifiantTechnique}`,
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      toast({
        title: "Échec de la connexion",
        description: "Impossible de se connecter avec cet identifiant.",
        variant: "destructive",
      });
      
      // Réinitialiser l'utilisateur en cas d'échec
      this.setCurrentUser(null);
      
      return false;
    }
  }

  // Test the database connection
  public async testConnection(): Promise<boolean> {
    try {
      console.log("Test de la connexion à la base de données...");
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.warn("Réponse d'erreur de la base de données:", responseText);
        throw new Error("Échec du test de connexion à la base de données");
      }
      
      const responseText = await response.text();
      const data = this.validateJsonResponse(responseText);
      
      if (data.status !== 'success') {
        console.warn("Échec de la connexion à la base de données:", data.message);
        throw new Error(data.message || "Échec de la connexion à la base de données");
      }
      
      toast({
        title: "Connexion réussie",
        description: `Connexion établie avec la base de données`,
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Impossible d'établir une connexion à la base de données.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Disconnect the current user
  public disconnectUser(): void {
    this.setCurrentUser(null);
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de la base de données.",
    });
  }

  // Get information about the database
  public async getDatabaseInfo(): Promise<DatabaseInfo | null> {
    try {
      console.log("Récupération des informations sur la base de données...");
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.warn("Réponse d'erreur lors de la récupération des informations:", response.status, responseText.substring(0, 100));
        throw new Error("Impossible de récupérer les informations de la base de données");
      }
      
      const responseText = await response.text();
      let data;
      
      try {
        data = this.validateJsonResponse(responseText);
      } catch (e) {
        console.error("Erreur lors de la récupération des informations de la base de données:", e);
        throw new Error("Réponse invalide du serveur");
      }
      
      if (data.status !== 'success') {
        throw new Error(data.message || "Impossible de récupérer les informations de la base de données");
      }
      
      if (data.info) {
        return {
          host: data.info.host || "Hôte inconnu",
          database: data.info.database_name || "Base de données inconnue",
          size: data.info.size || "Taille inconnue",
          tables: data.info.table_count || 0,
          lastBackup: data.info.last_backup || "N/A",
          status: "Online",
          encoding: data.info.encoding || "UTF-8",
          collation: data.info.collation || "N/A",
          tableList: data.info.tables || []
        };
      } else {
        throw new Error("Aucune information sur la base de données n'a été reçue");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations de la base de données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations de la base de données.",
        variant: "destructive",
      });
      
      throw error;
    }
  }
}

// Export the database connection service instance
const dbConnectionService = DatabaseConnectionService.getInstance();

// Export simplified functions for easier usage
export const connectAsUser = (identifiantTechnique: string): Promise<boolean> => {
  return dbConnectionService.connectAsUser(identifiantTechnique);
};

export const getCurrentUser = (): string | null => {
  return dbConnectionService.getCurrentUser();
};

export const disconnectUser = (): void => {
  dbConnectionService.disconnectUser();
};

export const testDatabaseConnection = (): Promise<boolean> => {
  return dbConnectionService.testConnection();
};

export const getDatabaseInfo = (): Promise<DatabaseInfo | null> => {
  return dbConnectionService.getDatabaseInfo();
};
