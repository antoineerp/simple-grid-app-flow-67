
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
  private lastError: string | null = null;

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
      console.error("Erreur d'analyse JSON:", e);
      console.log("Texte de réponse problématique:", responseText.substring(0, 200));
      
      // Si la réponse commence par <!DOCTYPE, c'est probablement une page HTML
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error("Reçu du HTML au lieu de JSON:", responseText.substring(0, 100) + "...");
        throw new Error("Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la configuration du serveur.");
      }
      
      // Si c'est une autre erreur de parsing, la propager
      throw new Error(`Erreur d'analyse JSON: ${e.message}. Réponse: ${responseText.substring(0, 100)}...`);
    }
  }

  // Get the last error
  public getLastError(): string | null {
    return this.lastError;
  }

  // Set the current user
  public setCurrentUser(identifiantTechnique: string | null): void {
    if (identifiantTechnique) {
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      localStorage.setItem('currentUser', identifiantTechnique);
      this.currentUser = identifiantTechnique;
      console.log(`User connected to the database: ${identifiantTechnique}`);
    } else {
      localStorage.removeItem('currentDatabaseUser');
      localStorage.removeItem('currentUser');
      this.currentUser = null;
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
      this.lastError = null;
      
      // Vérifier d'abord que l'utilisateur existe
      const API_URL = getApiUrl();
      const checkUserResponse = await fetch(`${API_URL}/check-users`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!checkUserResponse.ok) {
        const errorText = await checkUserResponse.text();
        console.error("Erreur lors de la vérification de l'utilisateur:", errorText);
        this.lastError = `Impossible de vérifier l'utilisateur: ${checkUserResponse.status}`;
        throw new Error(this.lastError);
      }
      
      const userCheckData = await checkUserResponse.json();
      console.log("Utilisateurs trouvés:", userCheckData.records ? userCheckData.records.length : 0);
      
      // Vérifier si l'utilisateur existe dans la liste retournée
      const userExists = userCheckData.records && userCheckData.records.some(
        (user: any) => user.identifiant_technique === identifiantTechnique
      );
      
      if (!userExists) {
        this.lastError = `L'utilisateur ${identifiantTechnique} n'existe pas dans la base de données`;
        console.error(this.lastError);
        toast({
          title: "Utilisateur inexistant",
          description: this.lastError,
          variant: "destructive",
        });
        return false;
      }
      
      // Set the current user
      this.setCurrentUser(identifiantTechnique);
      
      // Vérifier si la connexion à la base de données est possible
      const isConnected = await this.testConnection();
      
      if (!isConnected) {
        this.lastError = "Impossible de se connecter à la base de données";
        throw new Error(this.lastError);
      }
      
      // Ne plus ouvrir automatiquement une nouvelle fenêtre phpMyAdmin
      // Afficher juste un toast de succès avec la possibilité d'ouvrir phpMyAdmin
      const dbUrl = `https://${identifiantTechnique}.myd.infomaniak.com/phpMyAdmin/`;
      
      toast({
        title: "Connexion réussie",
        description: `Vous êtes maintenant connecté en tant que ${identifiantTechnique}`,
      });
      
      // Initialize user data if needed
      await initializeUserData(identifiantTechnique);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      
      // Si l'erreur n'a pas déjà été définie
      if (!this.lastError) {
        this.lastError = error instanceof Error ? error.message : "Erreur inconnue lors de la connexion";
      }
      
      toast({
        title: "Échec de la connexion",
        description: this.lastError,
        variant: "destructive",
      });
      
      // Réinitialiser l'utilisateur en cas d'échec
      this.setCurrentUser(null);
      
      return false;
    }
  }

  // Get the phpMyAdmin URL for the current user
  public getPhpMyAdminUrl(): string | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;
    return `https://${currentUser}.myd.infomaniak.com/phpMyAdmin/`;
  }

  // Test the database connection
  public async testConnection(): Promise<boolean> {
    try {
      console.log("Test de la connexion à la base de données...");
      const API_URL = getApiUrl();
      console.log("URL API pour le test de connexion:", `${API_URL}/db-connection-test`);
      
      const response = await fetch(`${API_URL}/db-connection-test`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-cache'
      });
      
      console.log("Statut de la réponse du test de connexion:", response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.warn("Réponse d'erreur de la base de données:", responseText);
        throw new Error(`Échec du test de connexion à la base de données (${response.status}: ${response.statusText})`);
      }
      
      const responseText = await response.text();
      console.log("Réponse du test de connexion:", responseText.substring(0, 200));
      
      const data = this.validateJsonResponse(responseText);
      
      if (data.status !== 'success') {
        console.warn("Échec de la connexion à la base de données:", data.message, data.error || "");
        throw new Error(data.error || data.message || "Échec de la connexion à la base de données");
      }
      
      toast({
        title: "Connexion réussie",
        description: `Connexion établie avec la base de données ${data.info?.database_name || ''}`,
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      this.lastError = error instanceof Error ? error.message : "Impossible d'établir une connexion à la base de données.";
      
      toast({
        title: "Erreur de connexion",
        description: this.lastError,
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
  public async getDatabaseInfo(): Promise<DatabaseInfo> {
    try {
      console.log("Récupération des informations sur la base de données...");
      const API_URL = getApiUrl();
      console.log("URL API pour les informations de la base de données:", `${API_URL}/database-test`);
      
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'GET',
        headers: { 
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log("Statut de la réponse des informations DB:", response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.warn("Réponse d'erreur lors de la récupération des informations:", response.status, responseText.substring(0, 100));
        throw new Error(`Impossible de récupérer les informations de la base de données (${response.status})`);
      }
      
      const responseText = await response.text();
      console.log("Réponse des informations DB (longueur):", responseText.length);
      console.log("Réponse des informations DB (début):", responseText.substring(0, 200));
      
      let data;
      
      try {
        data = this.validateJsonResponse(responseText);
      } catch (e) {
        console.error("Erreur lors de la validation de la réponse JSON:", e);
        throw new Error(`Réponse invalide du serveur: ${e.message}`);
      }
      
      if (!data) {
        throw new Error("Réponse vide du serveur");
      }
      
      console.log("Données analysées:", data);
      
      if (data.status !== 'success') {
        const errorMessage = data.error || data.message || "Impossible de récupérer les informations de la base de données";
        console.error("Erreur de base de données:", errorMessage);
        throw new Error(errorMessage);
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
        console.warn("Pas d'informations reçues de la base de données");
        throw new Error("Aucune information sur la base de données n'a été reçue");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations de la base de données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations de la base de données.",
        variant: "destructive",
      });
      
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

export const getLastConnectionError = (): string | null => {
  return dbConnectionService.getLastError();
};

export const disconnectUser = (): void => {
  dbConnectionService.disconnectUser();
};

export const testDatabaseConnection = (): Promise<boolean> => {
  return dbConnectionService.testConnection();
};

export const getDatabaseInfo = (): Promise<DatabaseInfo> => {
  return dbConnectionService.getDatabaseInfo();
};

export const getPhpMyAdminUrl = (): string | null => {
  return dbConnectionService.getPhpMyAdminUrl();
};
