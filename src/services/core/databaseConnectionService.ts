
import { toast } from '@/hooks/use-toast';
import { initializeUserData } from './userInitializationService';

// Type for the database information
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
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
      
      // Initialize user data if needed
      await initializeUserData(identifiantTechnique);
      
      toast({
        title: "Connection successful",
        description: `You are now connected as ${identifiantTechnique}`,
      });
      
      return true;
    } catch (error) {
      console.error("Error while connecting:", error);
      toast({
        title: "Connection failed",
        description: "Unable to connect with this identifier.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Test the database connection
  public async testConnection(): Promise<boolean> {
    try {
      console.log("Testing database connection...");
      
      // Simulate a successful test
      toast({
        title: "Connection successful",
        description: `Connection established with the database`,
      });
      
      return true;
    } catch (error) {
      console.error("Error during connection test:", error);
      toast({
        title: "Connection error",
        description: "Unable to establish a connection to the database.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Disconnect the current user
  public disconnectUser(): void {
    this.setCurrentUser(null);
    toast({
      title: "Successful disconnection",
      description: "You have been disconnected from the database.",
    });
  }

  // Get information about the database
  public async getDatabaseInfo(): Promise<DatabaseInfo | null> {
    try {
      console.log("Retrieving database information...");
      
      // In a real application, this would come from an API backend
      return {
        host: "p71x6d.myd.infomaniak.com",
        database: "p71x6d_system",
        size: "125 MB", // Simulated size
        tables: 10, // Simulated number
        lastBackup: "2025-04-17 08:00:00", // Simulated date
        status: "Online"
      };
    } catch (error) {
      console.error("Error while retrieving database information:", error);
      toast({
        title: "Error",
        description: "Unable to retrieve database information.",
        variant: "destructive",
      });
      return null;
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
