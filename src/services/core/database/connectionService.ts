
import { getAuthHeaders } from '@/services/auth/authService';
import { validateJsonResponse, showToast, getBaseUrl } from './utils';

class ConnectionService {
  private static instance: ConnectionService;
  private currentUser: string | null = null;
  private lastError: string | null = null;

  private constructor() {
    this.currentUser = localStorage.getItem('currentDatabaseUser');
  }

  public static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  public async connectAsUser(identifiantTechnique: string): Promise<boolean> {
    try {
      console.log(`Attempting to connect as ${identifiantTechnique}...`);
      this.lastError = null;
      
      const checkUserResponse = await fetch(`${getBaseUrl()}/check-users`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!checkUserResponse.ok) {
        const errorText = await checkUserResponse.text();
        this.lastError = `Impossible de vérifier l'utilisateur: ${checkUserResponse.status}`;
        throw new Error(this.lastError);
      }
      
      const userCheckData = await checkUserResponse.json();
      const userExists = userCheckData.records?.some(
        (user: any) => user.identifiant_technique === identifiantTechnique
      );
      
      if (!userExists) {
        this.lastError = `L'utilisateur ${identifiantTechnique} n'existe pas dans la base de données`;
        showToast("Utilisateur inexistant", this.lastError, "destructive");
        return false;
      }
      
      this.setCurrentUser(identifiantTechnique);
      
      const isConnected = await this.testConnection();
      if (!isConnected) {
        this.lastError = "Impossible de se connecter à la base de données";
        throw new Error(this.lastError);
      }
      
      showToast("Connexion réussie", `Vous êtes maintenant connecté en tant que ${identifiantTechnique}`);
      return true;
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      this.lastError = error instanceof Error ? error.message : "Erreur inconnue lors de la connexion";
      showToast("Échec de la connexion", this.lastError, "destructive");
      this.setCurrentUser(null);
      return false;
    }
  }

  public setCurrentUser(identifiantTechnique: string | null): void {
    if (identifiantTechnique) {
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      this.currentUser = identifiantTechnique;
    } else {
      localStorage.removeItem('currentDatabaseUser');
      this.currentUser = null;
    }
  }

  public getCurrentUser(): string | null {
    if (!this.currentUser) {
      this.currentUser = localStorage.getItem('currentDatabaseUser');
    }
    return this.currentUser;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  private async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${getBaseUrl()}/db-connection-test`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Connection test failed (${response.status})`);
      }
      
      const data = await validateJsonResponse(await response.text());
      return data.status === 'success';
    } catch (error) {
      console.error("Error testing connection:", error);
      return false;
    }
  }
}

const connectionService = ConnectionService.getInstance();

export const connectAsUser = (identifiantTechnique: string): Promise<boolean> => {
  return connectionService.connectAsUser(identifiantTechnique);
};

export const getCurrentUser = (): string | null => {
  return connectionService.getCurrentUser();
};

export const getLastConnectionError = (): string | null => {
  return connectionService.getLastError();
};
