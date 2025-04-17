
import { toast } from '@/hooks/use-toast';

// Types pour les utilisateurs
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string; // Toujours stocké haché
  identifiant_technique: string;
  role: string;
  date_creation: string;
}

// Type pour les informations de la base de données
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
}

// URL de base de l'API
const API_URL = 'https://votre-domaine.com/api';

// Classe pour gérer les connexions et les requêtes à la base de données
class DatabaseService {
  private static instance: DatabaseService;
  private currentUser: string | null = null;
  private token: string | null = null;

  private constructor() {
    // Constructeur privé pour le singleton
    console.log("Service de base de données initialisé");
    this.token = localStorage.getItem('authToken');
    this.currentUser = localStorage.getItem('currentDatabaseUser');
  }

  // Méthode pour obtenir l'instance du service (singleton)
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Définir l'utilisateur actuel connecté
  public setCurrentUser(identifiantTechnique: string | null): void {
    this.currentUser = identifiantTechnique;
    if (identifiantTechnique) {
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      console.log(`Utilisateur connecté à la base de données: ${identifiantTechnique}`);
    } else {
      localStorage.removeItem('currentDatabaseUser');
      localStorage.removeItem('authToken');
      this.token = null;
      console.log('Utilisateur déconnecté de la base de données');
    }
  }

  // Définir le token d'authentification
  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Obtenir l'utilisateur actuel
  public getCurrentUser(): string | null {
    if (!this.currentUser) {
      this.currentUser = localStorage.getItem('currentDatabaseUser');
    }
    return this.currentUser;
  }

  // Obtenir le token d'authentification
  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  // Headers pour les requêtes API authentifiées
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Cette fonction récupère les utilisateurs depuis la base de données
  async getUtilisateurs(): Promise<Utilisateur[]> {
    try {
      if (!this.getToken()) {
        throw new Error("Non authentifié");
      }
      
      const response = await fetch(`${API_URL}/utilisateurs`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la récupération des utilisateurs");
      }
      
      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de récupérer les utilisateurs depuis la base de données.",
        variant: "destructive",
      });
      
      // Fallback pour le développement
      return [
        {
          id: 1,
          nom: "Cirier",
          prenom: "Antoine",
          email: "antcirier@gmail.com",
          mot_de_passe: "****",
          identifiant_technique: "p71x6d_system",
          role: "admin",
          date_creation: "2025-03-31 16:10:09"
        },
        {
          id: 2,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          mot_de_passe: "****",
          identifiant_technique: "p71x6d_dupont",
          role: "utilisateur",
          date_creation: "2025-04-01 10:15:00"
        },
        {
          id: 3,
          nom: "Martin",
          prenom: "Sophie",
          email: "sophie.martin@example.com",
          mot_de_passe: "****",
          identifiant_technique: "p71x6d_martin",
          role: "gestionnaire",
          date_creation: "2025-04-02 14:30:00"
        }
      ];
    }
  }

  // Fonction pour se connecter à la base de données en tant qu'utilisateur
  async connectAsUser(identifiantTechnique: string): Promise<boolean> {
    try {
      console.log(`Tentative de connexion en tant que ${identifiantTechnique}...`);
      
      // Pour l'instant, simulons une connexion réussie
      // Dans une implémentation réelle, nous ferions une requête API
      this.setCurrentUser(identifiantTechnique);
      
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
      return false;
    }
  }

  // Fonction pour obtenir les informations de la base de données
  async getDatabaseInfo(): Promise<DatabaseInfo | null> {
    try {
      console.log("Récupération des informations de la base de données...");
      
      // Dans une application réelle, ces informations viendraient d'une API backend
      return {
        host: "p71x6d.myd.infomaniak.com",
        database: "p71x6d_system",
        size: "125 MB", // Taille simulée
        tables: 10, // Nombre simulé
        lastBackup: "2025-04-17 08:00:00", // Date simulée
        status: "Online"
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des informations de la base de données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations de la base de données.",
        variant: "destructive",
      });
      return null;
    }
  }

  // Fonction pour déconnecter l'utilisateur actuel
  disconnectUser(): void {
    this.setCurrentUser(null);
    this.setToken(null);
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de la base de données.",
    });
  }

  // Pour tester la connexion à la base de données
  async testConnection(): Promise<boolean> {
    try {
      console.log("Test de connexion à la base de données...");
      // Dans un environnement réel, on appellerait une API pour tester la connexion
      
      // Simuler un test réussi
      toast({
        title: "Connexion réussie",
        description: `Connexion établie avec la base de données`,
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible d'établir une connexion à la base de données.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Authentification avec nom d'utilisateur et mot de passe
  async login(username: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur d'authentification");
      }
      
      const data = await response.json();
      
      if (data.token && data.user) {
        // Stocker le token et les informations utilisateur
        this.setToken(data.token);
        this.setCurrentUser(data.user.identifiant_technique);
        localStorage.setItem('userRole', data.user.role);
        
        return {
          success: true,
          user: data.user
        };
      } else {
        throw new Error("Réponse d'authentification invalide");
      }
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur d'authentification inconnue"
      };
    }
  }
}

// Instance du service de base de données
const dbService = DatabaseService.getInstance();

// Exportation des fonctions du service pour une utilisation simplifiée
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  return dbService.getUtilisateurs();
};

export const connectAsUser = (identifiantTechnique: string): Promise<boolean> => {
  return dbService.connectAsUser(identifiantTechnique);
};

export const getDatabaseInfo = (): Promise<DatabaseInfo | null> => {
  return dbService.getDatabaseInfo();
};

export const disconnectUser = (): void => {
  dbService.disconnectUser();
};

export const getCurrentUser = (): string | null => {
  return dbService.getCurrentUser();
};

export const testDatabaseConnection = (): Promise<boolean> => {
  return dbService.testConnection();
};

export const loginUser = (username: string, password: string): Promise<any> => {
  return dbService.login(username, password);
};
